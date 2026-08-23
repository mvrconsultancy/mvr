import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side gate for admin routes.
 * Checks for the httpOnly session cookie before serving admin pages.
 * Full JWT validation still happens via /api/auth/me in useAdminAuth.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("mvr_access");
    if (!token?.value) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
