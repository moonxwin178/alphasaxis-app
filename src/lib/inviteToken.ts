import "server-only";
import { SignJWT, jwtVerify } from "jose";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const secretKey = process.env.SESSION_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

function requireKey(): Uint8Array {
  if (!encodedKey) {
    throw new Error("Invite tokens are not configured: missing SESSION_SECRET env var.");
  }
  return encodedKey;
}

/** Signed, time-boxed token letting a freshly-created account claim its own password — never emails a plaintext password. */
export async function createConsultantInviteToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: "consultant-invite" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + INVITE_TTL_MS) / 1000))
    .sign(requireKey());
}

export async function verifyConsultantInviteToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, requireKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "consultant-invite" || typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
