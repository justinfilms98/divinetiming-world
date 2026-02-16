/**
 * Admin auth - single source of truth for admin checks.
 * Server-side only. Use in API routes.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

function isAdmin(email: string): boolean {
  const admins = process.env.ADMIN_EMAILS;
  if (admins) {
    const list = admins.split(',').map((e) => e.trim().toLowerCase());
    if (list.includes(email.toLowerCase())) return true;
  }
  return false;
}

export interface RequireAdminResult {
  error?: NextResponse;
  supabase?: ReturnType<typeof getServiceClient>;
  user?: { email: string };
}

/** Use in API routes. Returns { error } on auth failure, { supabase, user } on success. */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const email = user.email.toLowerCase();
  let allowed = isAdmin(email);
  if (!allowed) {
    const { data } = await authClient
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();
    allowed = !!data;
  }
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  let supabase;
  try {
    supabase = getServiceClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SUPABASE_SERVICE_ROLE_KEY not configured';
    return { error: NextResponse.json({ error: msg }, { status: 500 }) };
  }
  return { supabase, user: { email } };
}
