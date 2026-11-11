// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isJournalPublicEnabled } from "@/lib/features";
import {
  isJournalPath,
  isPublicJournalSlug,
  journalSlugFromPath,
  JOURNAL_NOT_FOUND_PATH,
} from "@/lib/journal/visibility";

/**
 * Journal URLs: genuine 404s for hidden episodes. The root loading.tsx would otherwise commit the
 * response to 200 before the page could call notFound(). Rewriting to an unmatched path makes Next
 * serve the site's own 404 page with status 404.
 */
async function journalGate(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const notFound = () => NextResponse.rewrite(new URL(JOURNAL_NOT_FOUND_PATH, req.url));
  if (!isJournalPublicEnabled()) return notFound();
  if (pathname === "/journal" || pathname === "/journal/") return NextResponse.next();
  const slug = journalSlugFromPath(pathname);
  if (slug === null) return notFound();
  const visible = await isPublicJournalSlug(slug, {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return visible ? NextResponse.next() : notFound();
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isJournalPath(pathname)) return journalGate(req);

  // CRITICAL: Immediately return for non-admin routes
  // Do NOT process "/" or any public routes - only /admin paths should reach the auth check
  // This early return ensures homepage and public routes are never intercepted
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

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
  // Admin routes (session check) and Journal routes (visibility check) only; the homepage and
  // every other public route are never intercepted.
  matcher: [
    '/admin/:path*',
    '/admin',
    '/journal',
    '/journal/:path*',
  ],
};
