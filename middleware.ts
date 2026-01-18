import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

const ALLOWLIST_EMAIL = 'divinetiming.world@gmail.com';

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request);

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.redirect(new URL('/login', request.url));
    }

    // Check allowlist
    if (user.email.toLowerCase() !== ALLOWLIST_EMAIL.toLowerCase()) {
      return Response.redirect(new URL('/', request.url));
    }

    // Verify in admin_users table
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();

    if (!data) {
      return Response.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
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
