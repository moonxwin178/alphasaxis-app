import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { generateUniqueReferralCode } from "@/lib/referral";
import { getGrandMasterId } from "@/lib/grandMaster";
import { createInviteToken } from "@/lib/inviteToken";
import { sendNotificationEmail } from "@/lib/email";
import { getClientIp, isRateLimited, stripControlChars, EMAIL_PATTERN } from "@/lib/apiSecurity";
import type { FinancingType } from "@/generated/prisma/client";

export const runtime = "nodejs";

const PHONE_PATTERN = /^[0-9+\-() ]{5,30}$/;
const NAME_MAX = 100;
const PHONE_MAX = 30;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

const FINANCING_TYPE_MAP: Record<string, FinancingType> = {
  "Real Estate Financing": "MORTGAGE",
  "Hire Purchase": "HIRE_PURCHASE",
  "Personal Loan": "PERSONAL",
  "Business Financing": "BUSINESS",
};

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseAmount(raw: unknown): string {
  if (typeof raw !== "string") return "0";
  const digits = raw.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : "0";
}

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get("x-internal-secret") ?? "";
  if (!secret || !timingSafeEqualStrings(provided, secret)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited("leads-public", ip, WINDOW_MS, MAX_REQUESTS_PER_WINDOW)) {
    return Response.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { name, phone, financingType, amount, email, refCode } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > NAME_MAX) {
    return Response.json({ ok: false, error: "Invalid name." }, { status: 400 });
  }
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) {
    return Response.json({ ok: false, error: "Invalid phone." }, { status: 400 });
  }
  if (typeof financingType !== "string" || !(financingType in FINANCING_TYPE_MAP)) {
    return Response.json({ ok: false, error: "Invalid financing type." }, { status: 400 });
  }

  const cleanName = stripControlChars(name).slice(0, NAME_MAX);
  const cleanPhone = stripControlChars(phone).slice(0, PHONE_MAX);
  const mappedFinancingType = FINANCING_TYPE_MAP[financingType];
  const cleanAmount = parseAmount(amount);
  const cleanEmail =
    typeof email === "string" && EMAIL_PATTERN.test(email.trim()) ? email.trim().toLowerCase() : null;
  const cleanRefCode = typeof refCode === "string" ? refCode.trim().toUpperCase() : "";

  const prisma = getPrisma();

  // Resolve the referrer: a real consultant/agent's code if valid, else the
  // grandmaster placeholder — same fallback registerUser() already uses, so
  // referredById is never left null.
  const referrer = cleanRefCode ? await prisma.user.findUnique({ where: { referralCode: cleanRefCode } }) : null;
  const referredById = referrer?.id ?? (await getGrandMasterId());
  const consultantId = referrer?.role === "LOAN_CONSULTANT" ? referrer.id : null;

  // Dedup: an existing lead calling back in (or a second inquiry) attaches a
  // new Case to their existing account instead of creating a duplicate.
  let user = await prisma.user.findFirst({ where: { phone: cleanPhone } });
  if (!user && cleanEmail) {
    user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  }

  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const referralCode = await generateUniqueReferralCode();
    // Consultation form doesn't require an email — synthesize a unique,
    // clearly-marked placeholder when none was given (same @...internal
    // convention as the grandmaster placeholder account) so the unique
    // User.email constraint is satisfied without adding a hard requirement
    // to the marketing-site form.
    const finalEmail = cleanEmail ?? `lead-${cleanPhone.replace(/[^0-9]/g, "") || crypto.randomUUID()}@leads.alphasaxis.internal`;

    user = await prisma.user.create({
      data: {
        name: cleanName,
        email: finalEmail,
        phone: cleanPhone,
        passwordHash,
        referralCode,
        role: "USER",
        referredById,
      },
    });
  }

  const financingCase = await prisma.case.create({
    data: {
      applicantId: user.id,
      financingType: mappedFinancingType,
      amount: cleanAmount,
      status: "SUBMITTED",
      servicingMode: "NEEDS_CONSULTANT",
      consultantId,
    },
  });

  await prisma.caseEvent.create({
    data: {
      caseId: financingCase.id,
      type: "LEAD_SUBMITTED_MARKETING_SITE",
      note: `Source: alphasaxis.com consultation form${cleanRefCode ? ` · ref ${cleanRefCode}` : ""}`,
    },
  });

  if (isNewUser) {
    const token = await createInviteToken(user.id, "account-claim");
    const claimUrl = `https://app.alphasaxis.com/claim-account?token=${token}`;

    if (cleanEmail) {
      await sendNotificationEmail(
        user.email,
        "Your AlphasAxis account is ready",
        `<p>Hi ${cleanName},</p><p>Thanks for reaching out about financing — we've started your case. Set a password to track it and start earning points on AlphasAxis:</p><p><a href="${claimUrl}">${claimUrl}</a></p><p>This link expires in 7 days.</p>`
      );
    } else {
      // No real email on file (phone-only lead) — the claim link can't be
      // emailed anywhere real, so log it on the case timeline instead. The
      // assigned consultant is expected to share it directly (call/WhatsApp)
      // when they follow up, same as any other manual outreach.
      await prisma.caseEvent.create({
        data: {
          caseId: financingCase.id,
          type: "ACCOUNT_CLAIM_LINK",
          note: `No email on file — share this claim link with the lead directly: ${claimUrl} (expires in 7 days)`,
        },
      });
    }
  }

  return Response.json({ ok: true });
}
