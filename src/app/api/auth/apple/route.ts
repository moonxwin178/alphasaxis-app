import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * "Sign in with Apple" needs a paid Apple Developer Program membership,
 * a Services ID, and a private key (.p8) to sign the client secret JWT —
 * none of which exist yet. Redirect with a clear reason instead of a raw
 * 404/500 until those are provisioned.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=apple_not_configured", request.url));
}
