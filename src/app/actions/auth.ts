"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { EMAIL_PATTERN, getClientIpFromHeaders, isRateLimited, stripControlChars } from "@/lib/apiSecurity";
import { generateUniqueReferralCode } from "@/lib/referral";
import { getGrandMasterId } from "@/lib/grandMaster";
import { verifyInviteToken } from "@/lib/inviteToken";

export type AuthFormState = { error?: string } | undefined;

const NAME_MAX = 100;

/**
 * Phase A only activates USER-role accounts. Agent/Agency self-registration
 * (with admin approval before commission-earning access is granted, per the
 * plan's trust-boundary risk flag) ships alongside the Agent/Agency screens
 * in Phase B — there's nowhere for those roles to go yet.
 */
export async function registerUser(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = getClientIpFromHeaders(await headers());
  if (isRateLimited("auth-register", ip, 10 * 60 * 1000, 10)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const name = stripControlChars(String(formData.get("name") ?? "")).slice(0, NAME_MAX);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = stripControlChars(String(formData.get("phone") ?? "")).slice(0, 30) || null;

  if (name.length < 2) return { error: "Please enter your full name." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = await generateUniqueReferralCode();

  const refCodeRaw = String(formData.get("ref") ?? "").trim().toUpperCase();
  const referrer = refCodeRaw ? await prisma.user.findUnique({ where: { referralCode: refCodeRaw } }) : null;
  // Every account is bound under a real referrer or, failing that, the
  // Grand Master 001 placeholder — referredById is never left null.
  const referredById = referrer?.id ?? (await getGrandMasterId());

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      referralCode,
      role: "USER",
      referredById,
    },
  });

  if (referrer) {
    await Promise.all([
      prisma.pointsLedgerEntry.create({
        data: { userId: referrer.id, delta: 25, reason: "REFERRAL_BONUS", refId: user.id },
      }),
      prisma.pointsLedgerEntry.create({
        data: { userId: user.id, delta: 10, reason: "REFERRAL_BONUS", refId: referrer.id },
      }),
    ]);
  }

  await createSession(user.id);
  redirect("/kyc");
}

export async function loginUser(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = getClientIpFromHeaders(await headers());
  if (isRateLimited("auth-login", ip, 10 * 60 * 1000, 20)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email) || !password) {
    return { error: "Please enter a valid email and password." };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-shape response whether the email exists or not, to avoid
  // leaking account existence via response differences.
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !validPassword) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);

  const homeByRole: Record<string, string> = {
    USER: "/cases",
    AGENT: "/agent/pipeline",
    AGENCY: "/agency/agents",
    LOAN_CONSULTANT: "/consultant/pipeline",
    ADMIN: "/admin/users",
  };
  redirect(homeByRole[user.role] ?? "/cases");
}

export async function logoutUser(_formData: FormData): Promise<void> {
  await deleteSession();
  redirect("/login");
}

/**
 * Shared "set your password" flow for any account that was created without
 * one — Loan Consultants (admin-invited) and marketing-site leads
 * (auto-created on consultation-form submit) both land here via a signed,
 * purpose-scoped token. See inviteToken.ts.
 */
export async function acceptAccountClaim(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const decoded = await verifyInviteToken(token, ["consultant-invite", "account-claim"]);
  if (!decoded) return { error: "This invite link is invalid or has expired." };

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return { error: "Invite account not found." };
  if (decoded.purpose === "consultant-invite" && user.role !== "LOAN_CONSULTANT") {
    return { error: "Invite account not found." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await createSession(user.id);
  redirect(decoded.purpose === "consultant-invite" ? "/consultant/pipeline" : "/earn");
}
