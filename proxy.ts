import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Optimistic-only checks (cookie presence/signature, no DB) — see
// node_modules/next/dist/docs/01-app/02-guides/authentication.md.
// Real authorization happens server-side via requireUser()/requireRole()
// in src/lib/dal.ts on every protected page/action.

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/calculator"];
const AGENT_PREFIX = "/agent";
const AGENCY_PREFIX = "/agency";
const ADMIN_PREFIX = "/admin";

async function hasValidSessionCookie(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get("session")?.value;
  if (!cookieValue) return false;

  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) return false;

  try {
    await jwtVerify(cookieValue, new TextEncoder().encode(secretKey), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isRoleGated =
    pathname.startsWith(AGENT_PREFIX) || pathname.startsWith(AGENCY_PREFIX) || pathname.startsWith(ADMIN_PREFIX);

  if (isPublic) return NextResponse.next();

  const authed = await hasValidSessionCookie(req);
  if (!authed) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Role-specific enforcement (not just "authenticated") still happens in
  // requireRole() server-side, since Proxy only does optimistic cookie
  // presence checks here, not a DB role lookup.
  void isRoleGated;

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
