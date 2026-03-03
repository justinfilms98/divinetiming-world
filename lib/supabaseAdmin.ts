import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client with service role.
 * Use for admin uploads and DB writes that must not depend on browser session.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}
