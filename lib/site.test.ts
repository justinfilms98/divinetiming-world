import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSite(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  return import('./site');
}

describe('BASE_URL', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the branded domain in production even when VERCEL_URL is a deployment host', async () => {
    const site = await loadSite({
      NEXT_PUBLIC_SITE_URL: '',
      VERCEL_ENV: 'production',
      VERCEL_URL: 'divinetiming-world-abc123-divine-timings-projects.vercel.app',
    });
    expect(site.BASE_URL).toBe('https://divinetiming.world');
    expect(site.IS_PRODUCTION_SITE).toBe(true);
  });

  it('uses the deployment host on previews and marks them non-production', async () => {
    const site = await loadSite({
      NEXT_PUBLIC_SITE_URL: '',
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'divinetiming-world-git-fix-divine-timings-projects.vercel.app',
    });
    expect(site.BASE_URL).toBe('https://divinetiming-world-git-fix-divine-timings-projects.vercel.app');
    expect(site.IS_PRODUCTION_SITE).toBe(false);
  });

  it('prefers an explicit NEXT_PUBLIC_SITE_URL and strips trailing slashes', async () => {
    const site = await loadSite({ NEXT_PUBLIC_SITE_URL: 'https://divinetiming.world/', VERCEL_ENV: 'production' });
    expect(site.BASE_URL).toBe('https://divinetiming.world');
    expect(site.canonicalUrl('events')).toBe('https://divinetiming.world/events');
  });
});
