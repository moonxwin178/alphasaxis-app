import "server-only";
import { SignJWT, jwtVerify } from "jose";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const secretKey = process.env.SESSION_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

export type InvitePurpose = "consultant-invite" | "account-claim";

function requireKey(): Uint8Array {
  if (!encodedKey) {
    throw new Error("Invite tokens are not configured: missing SESSION_SECRET env var.");
  }
  return encodedKey;
}

/** Signed, time-boxed token letting a freshly-created account claim its own password — never emails a plaintext password. */
export async function createInviteToken(userId: string, purpose: InvitePurpose): Promise<string> {
  return new SignJWT({ userId, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + INVITE_TTL_MS) / 1000))
    .sign(requireKey());
}

export async function verifyInviteToken(
  token: string,
  expectedPurposes: InvitePurpose[]
): Promise<{ userId: string; purpose: InvitePurpose } | null> {
  try {
    const { payload } = await jwtVerify(token, requireKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.purpose !== "string" ||
      !expectedPurposes.includes(payload.purpose as InvitePurpose) ||
      typeof payload.userId !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId, purpose: payload.purpose as InvitePurpose };
  } catch {
    return null;
  }
}
