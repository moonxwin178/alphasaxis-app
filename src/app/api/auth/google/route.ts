import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/googleAuth";

export const runtime = "nodejs";

const STATE_COOKIE = "google_oauth_state";

/** Kicks off Google sign-in: sets a CSRF state cookie, then redirects to Google's consent screen. */
export async function GET(request: NextRequest) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const state = randomBytes(24).toString("hex");

  const response = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
