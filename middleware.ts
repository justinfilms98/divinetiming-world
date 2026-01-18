import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ALLOWLIST_EMAIL = 'divinetiming.world@gmail.com';

export async function middleware(request: NextRequest) {
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are missing, skip Supabase operations
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware');
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next();

  try {
    // Create Edge-compatible Supabase client
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Get user for admin route protection
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.email) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check allowlist
      if (user.email.toLowerCase() !== ALLOWLIST_EMAIL.toLowerCase()) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Verify in admin_users table (with error handling)
      try {
        const { data, error: dbError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .single();

        if (dbError || !data) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (dbError) {
        // If database query fails, redirect to home for safety
        console.error('Database query error in middleware:', dbError);
        return NextResponse.redirect(new URL('/', request.url));
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
