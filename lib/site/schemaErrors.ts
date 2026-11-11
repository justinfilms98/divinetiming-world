/** PostgREST/Postgres errors for a column that doesn't exist (migration not yet applied). */
export function isMissingColumnError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  return /column .* does not exist|could not find the .* column/i.test(error.message ?? '');
}

export const MIGRATION_059_REQUIRED =
  'These settings need the database update (migration 059) before they can be saved. Nothing was changed.';
