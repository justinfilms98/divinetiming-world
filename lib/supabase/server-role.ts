import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client with SERVICE ROLE key.
 * Bypasses RLS - use only in trusted server routes after auth checks.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for server-side inserts'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
