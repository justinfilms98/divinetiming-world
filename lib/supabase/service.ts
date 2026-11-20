import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceRoleKey, ENV_ERROR_MESSAGES } from '@/lib/env';
import { PRODUCTION_SUPABASE_REF, isStagingDeployBranch } from '@/lib/deploy/stagingGuard';

/**
 * Server-only Supabase client with SERVICE ROLE key.
 * Bypasses RLS — use only in trusted server routes after auth checks.
 * Import only in server code (e.g. route handlers).
 * Throws with a safe message (no key leak) when env is missing.
 */
export function getServiceClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    throw new Error(ENV_ERROR_MESSAGES.supabaseUnavailable);
  }
  // Defense in depth: staging branches never construct a client against production.
  if (isStagingDeployBranch() && url.includes(PRODUCTION_SUPABASE_REF)) {
    throw new Error(ENV_ERROR_MESSAGES.supabaseUnavailable);
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
