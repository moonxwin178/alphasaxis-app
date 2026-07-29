import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { verifySession, type SessionUser } from "./session";

/** Memoized per-request. Redirects to /login if there's no valid session. */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const user = await verifySession();
  if (!user) redirect("/login");
  return user;
});

/** Same as requireUser, but also enforces the caller has one of the given roles. */
export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/login");
  return user;
}
