/**
 * Fail closed: staging/* Vercel branches must use Divine Timing Staging Supabase.
 * Prevents a misconfigured Preview env from silently talking to production.
 */

export const STAGING_SUPABASE_REF = 'goapnjajsjslxbjqthyo';
export const PRODUCTION_SUPABASE_REF = 'lokewuvbrrvmlgdwivoa';

export function assertStagingIsolation(env: {
  gitRef?: string | null;
  supabaseUrl?: string | null;
} = {}): void {
  const ref = env.gitRef ?? process.env.VERCEL_GIT_COMMIT_REF ?? '';
  if (!ref.startsWith('staging/')) return;

  const url = env.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!url.includes(STAGING_SUPABASE_REF)) {
    throw new Error(
      `Staging branch "${ref}" must use Divine Timing Staging (${STAGING_SUPABASE_REF}). ` +
        `Refusing to start with ${url ? `URL containing a different project` : 'missing NEXT_PUBLIC_SUPABASE_URL'}.`
    );
  }
  if (url.includes(PRODUCTION_SUPABASE_REF)) {
    throw new Error(
      `Staging branch "${ref}" is pointed at production Supabase (${PRODUCTION_SUPABASE_REF}). Refusing to start.`
    );
  }
}
