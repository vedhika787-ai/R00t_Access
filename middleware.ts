import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected route prefixes
  const protectedPaths = ["/dashboard", "/contracts", "/playbook", "/audit", "/settings"];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const session = request.cookies.get("lexiguard_session")?.value;

  // If attempting to access a protected route without an active session
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/contracts",
    "/contracts/:path*",
    "/playbook",
    "/playbook/:path*",
    "/audit",
    "/audit/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
