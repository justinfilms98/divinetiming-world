/**
 * Trigger on-demand revalidation so frontend reflects admin changes immediately.
 * Call after successful admin save operations.
 */

const REVALIDATE_PATHS: Record<string, string[]> = {
  home: ['/'],
  homepage: ['/'],
  events: ['/events'],
  media: ['/media'],
  shop: ['/shop'],
  booking: ['/booking'],
  about: ['/about'],
  pages: ['/', '/events', '/media', '/shop', '/booking', '/about'],
};

export async function revalidateAfterSave(scope: keyof typeof REVALIDATE_PATHS): Promise<void> {
  const paths = REVALIDATE_PATHS[scope];
  if (!paths?.length) return;

  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
      credentials: 'same-origin',
    });
  } catch {
    // Non-fatal: frontend will show updates on next full navigation/refresh
  }
}

export async function revalidatePaths(paths: string[]): Promise<void> {
  if (!paths.length) return;

  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
      credentials: 'same-origin',
    });
  } catch {
    // Non-fatal
  }
}
