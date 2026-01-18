// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect admin paths
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Cookie presence check only (no DB validation here)
  // Check for common Supabase SSR cookie patterns
  const hasSession =
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb:token") ||
    req.cookies.get("sb-access-token.0") ||
    req.cookies.get("sb-refresh-token") ||
    req.cookies.get("supabase-auth-token") ||
    // Supabase SSR typically uses cookies like: sb-<project-ref>-auth-token.0
    // Check for any cookie starting with "sb-" that contains "auth" or "token"
    Array.from(req.cookies.getAll()).some(
      (cookie) =>
        cookie.name.startsWith("sb-") &&
        (cookie.name.includes("auth") || cookie.name.includes("token"))
    );

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes, but only process /admin paths internally
  // This ensures the proxy doesn't block other routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
