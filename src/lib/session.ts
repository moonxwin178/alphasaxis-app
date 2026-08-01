import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getPrisma } from "./prisma";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const secretKey = process.env.SESSION_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

function requireKey(): Uint8Array {
  if (!encodedKey) {
    throw new Error("Session is not configured: missing SESSION_SECRET env var.");
  }
  return encodedKey;
}

async function encrypt(sessionToken: string, expiresAt: Date): Promise<string> {
  return new SignJWT({ sessionToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(requireKey());
}

async function decrypt(cookieValue: string): Promise<{ sessionToken: string } | null> {
  try {
    const { payload } = await jwtVerify(cookieValue, requireKey(), { algorithms: ["HS256"] });
    if (typeof payload.sessionToken !== "string") return null;
    return { sessionToken: payload.sessionToken };
  } catch {
    return null;
  }
}

/** Creates a database session row + sets the httpOnly encrypted cookie. Call after verifying credentials. */
export async function createSession(userId: string): Promise<void> {
  const prisma = getPrisma();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const sessionToken = randomBytes(32).toString("hex");

  await prisma.session.create({ data: { sessionToken, userId, expires } });

  const cookieValue = await encrypt(sessionToken, expires);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    sameSite: "lax",
    path: "/",
  });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "AGENT" | "AGENCY" | "LOAN_CONSULTANT" | "ADMIN";
}

/** Verifies the session cookie against the database. Returns null if absent/expired/revoked. */
export async function verifySession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const decoded = await decrypt(cookieValue);
  if (!decoded) return null;

  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { sessionToken: decoded.sessionToken },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  if (!session || session.expires < new Date()) return null;
  return session.user;
}

/** Deletes the current session, both the DB row (so it can't be replayed) and the cookie. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;

  if (cookieValue) {
    const decoded = await decrypt(cookieValue);
    if (decoded) {
      const prisma = getPrisma();
      await prisma.session.deleteMany({ where: { sessionToken: decoded.sessionToken } });
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}
