import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { generateUniqueReferralCode } from "@/lib/referral";
import { exchangeGoogleCode } from "@/lib/googleAuth";
import { getClientIp, isRateLimited } from "@/lib/apiSecurity";

export const runtime = "nodejs";

const STATE_COOKIE = "google_oauth_state";

const HOME_BY_ROLE: Record<string, string> = {
  USER: "/cases",
  AGENT: "/agent/pipeline",
  AGENCY: "/agency/agents",
  ADMIN: "/admin/users",
};

export async function GET(request: NextRequest) {
  const loginUrl = (error: string) => new URL(`/login?error=${error}`, request.url);

  const ip = getClientIp(request);
  if (isRateLimited("google-oauth-callback", ip, 10 * 60 * 1000, 20)) {
    return NextResponse.redirect(loginUrl("rate_limited"));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  const response = (target: URL) => {
    const res = NextResponse.redirect(target);
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  if (!code || !state || !expectedState || state !== expectedState) {
    return response(loginUrl("google_invalid_state"));
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
    const profile = await exchangeGoogleCode(code, redirectUri);
    const email = profile.email.toLowerCase();

    const prisma = getPrisma();
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
      const referralCode = await generateUniqueReferralCode();
      user = await prisma.user.create({
        data: {
          name: profile.name?.trim() || email.split("@")[0],
          email,
          passwordHash,
          referralCode,
          role: "USER",
        },
      });
    }

    await createSession(user.id);
    return response(new URL(isNewUser ? "/kyc" : (HOME_BY_ROLE[user.role] ?? "/cases"), request.url));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return response(loginUrl("google_failed"));
  }
}
