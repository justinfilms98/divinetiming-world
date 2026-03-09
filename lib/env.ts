/**
 * Server-side environment validation and safe getters.
 * Phase 14 — Production Readiness. Import only in server code (API routes, server components, server-only libs).
 */

import 'server-only';

/** User-facing messages when env is missing or a feature is unavailable. Never expose stack or vendor errors. */
export const ENV_ERROR_MESSAGES = {
  checkoutUnavailable: 'Checkout is temporarily unavailable. Please try again later or contact us.',
  supabaseUnavailable: 'Service temporarily unavailable.',
  stripeUnavailable: 'Payment service is temporarily unavailable.',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  /** Safe message for admin/API 500 responses; do not expose error.message to client. */
  operationFailed: 'Operation failed.',
} as const;

/** Required for server-side Supabase (API routes, admin). Never expose service role key to client. */
export function getSupabaseServiceRoleKey(): string | null {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Required for Supabase client (URL). Public value. */
export function getSupabaseUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Required for Supabase anon client (browser/middleware). Public value. */
export function getSupabaseAnonKey(): string | null {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Required for Stripe checkout/webhooks. Server-only. */
export function getStripeSecretKey(): string | null {
  const v = process.env.STRIPE_SECRET_KEY;
  return typeof v === 'string' && v.startsWith('sk_') ? v : null;
}

/** Optional. Canonical site URL for metadata/OG. Falls back to VERCEL_URL or default. */
export function getSiteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof v === 'string' && v.startsWith('http')) return v;
  const vercel = process.env.VERCEL_URL;
  if (typeof vercel === 'string' && vercel) return `https://${vercel}`;
  return 'https://divinetiming.world';
}

/** Returns true if Stripe is configured (checkout can be used). */
export function isStripeConfigured(): boolean {
  return getStripeSecretKey() !== null;
}
