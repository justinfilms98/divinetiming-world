/**
 * QA helpers — run only in development/preview. Never crash production or expose secrets.
 */

function isDevOrPreview(): boolean {
  if (typeof process === 'undefined') return false;
  const env = process.env?.NODE_ENV ?? '';
  const vercel = process.env?.VERCEL_ENV ?? '';
  return env === 'development' || vercel === 'preview';
}

/**
 * Logs warnings if key env vars are missing. Call from server code only where safe.
 * Does not throw or expose values.
 */
export function assertEnv(): void {
  if (!isDevOrPreview()) return;

  const vars: { key: string; serverOnly?: boolean }[] = [
    { key: 'NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', serverOnly: true },
  ];

  for (const { key, serverOnly } of vars) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      const where = serverOnly ? ' (server)' : '';
      console.warn(`[QA] Missing env${where}: ${key}`);
    }
  }
}
