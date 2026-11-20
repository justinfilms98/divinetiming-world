/** Shared staging-branch isolation checks (safe to unit-test without server-only). */

export const STAGING_SUPABASE_REF = 'goapnjajsjslxbjqthyo';
export const PRODUCTION_SUPABASE_REF = 'lokewuvbrrvmlgdwivoa';

export function isStagingDeployBranch(ref = process.env.VERCEL_GIT_COMMIT_REF ?? ''): boolean {
  return ref === 'staging/d2a' || ref === 'staging/d3a';
}

/** Returns false when a staging branch is pointed at the wrong Supabase project. */
export function stagingSupabaseUrlAllowed(
  url: string | null | undefined,
  ref = process.env.VERCEL_GIT_COMMIT_REF ?? ''
): boolean {
  if (!isStagingDeployBranch(ref)) return true;
  if (!url) return false;
  if (!url.includes(STAGING_SUPABASE_REF)) return false;
  if (url.includes(PRODUCTION_SUPABASE_REF)) return false;
  return true;
}
