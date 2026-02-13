import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Path patterns: exact paths or prefixes (e.g. /shop/*) */
const ALLOWED_EXACT = ['/', '/events', '/media', '/shop', '/booking', '/about'];

function isPathAllowed(path: string): boolean {
  if (ALLOWED_EXACT.includes(path)) return true;
  if (path.startsWith('/shop/') && path.length > 6) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();

    if (!data) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const paths = Array.isArray(body.paths) ? body.paths : body.path ? [body.path] : [];

    if (paths.length === 0) {
      return NextResponse.json({ error: 'No paths provided' }, { status: 400 });
    }

    for (const path of paths) {
      if (isPathAllowed(path)) {
        revalidatePath(path, path.startsWith('/shop/') ? 'page' : undefined);
      }
    }

    return NextResponse.json({ revalidated: true, paths });
  } catch (err) {
    console.error('Revalidate error:', err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
