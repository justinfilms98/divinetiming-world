import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ALLOWLIST_EMAIL = 'divinetiming.world@gmail.com';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create Edge-compatible Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Update Supabase session and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (authError || !user?.email) {
        return Response.redirect(new URL('/login', request.url));
      }

      // Check allowlist
      if (user.email.toLowerCase() !== ALLOWLIST_EMAIL.toLowerCase()) {
        return Response.redirect(new URL('/', request.url));
      }

      // Verify in admin_users table
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .single();

      if (dbError || !data) {
        return Response.redirect(new URL('/', request.url));
      }
    }
  } catch (error) {
    // If middleware fails, allow the request to proceed to avoid breaking the site
    // Log error in production for debugging
    console.error('Middleware error:', error);
    // Return the response without additional checks
  }

  return supabaseResponse;
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
