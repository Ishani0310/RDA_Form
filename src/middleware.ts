import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// Administrative routes requiring active officer authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/contractors",
  "/submissions",
  "/qr-management",
  "/form-builder",
  "/reports",
  "/user-management",
  "/settings",
];

// High-privilege routes restricted to Super Administrators and Provincial Directors
const ELEVATED_ROUTES = ["/user-management", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const token = sessionCookie?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. If user is already authenticated and attempts to access the login page, redirect to dashboard
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Check if the current route is protected
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    // Unauthenticated: Redirect to login with original destination
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Role-Based Access Control (RBAC) checks
    const isElevated = ELEVATED_ROUTES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isElevated) {
      const allowedRoles = ["SUPER_ADMIN", "PROVINCIAL_DIRECTOR"];
      if (!allowedRoles.includes(session.role)) {
        // Redirect unauthorized officer back to dashboard with notification
        const unauthorizedUrl = new URL("/dashboard", request.url);
        unauthorizedUrl.searchParams.set("denied", "insufficient_privileges");
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
