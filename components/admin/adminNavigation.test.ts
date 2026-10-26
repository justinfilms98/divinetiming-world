import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function adminPageRoutes(dir = path.join(process.cwd(), 'app', 'admin'), base = '/admin'): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === 'page.tsx') routes.push(base);
    if (entry.isDirectory() && !entry.name.startsWith('[') && !entry.name.startsWith('(')) {
      routes.push(...adminPageRoutes(path.join(dir, entry.name), `${base}/${entry.name}`));
    }
  }
  return routes;
}

async function loadNav(inboxEnabled: boolean) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_CONTENT_INBOX_ENABLED', inboxEnabled ? '1' : '');
  return import('./adminNavigation');
}

describe('admin navigation', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('links every existing admin page exactly once (inbox flag on)', async () => {
    const { ADMIN_NAV_GROUPS } = await loadNav(true);
    const linked = ADMIN_NAV_GROUPS.flatMap((g) => g.items.filter((i) => !i.comingSoon).map((i) => i.href));
    expect(new Set(linked).size).toBe(linked.length);
    expect([...linked].sort()).toEqual(adminPageRoutes().sort());
  });

  it('hides flag-gated pages when the flag is off, keeping everything else', async () => {
    const { ADMIN_NAV_GROUPS } = await loadNav(false);
    const linked = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(linked).not.toContain('/admin/inbox');
    expect(linked).not.toContain('/admin/integrations');
    expect(linked).toContain('/admin/label');
  });

  it('never links planned pages that do not exist yet', async () => {
    const { ADMIN_NAV_GROUPS } = await loadNav(true);
    const routes = new Set(adminPageRoutes());
    for (const item of ADMIN_NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.comingSoon)) {
      expect(routes.has(item.href)).toBe(false);
    }
  });

  it('resolves the active group for nested routes', async () => {
    const { findActiveNav } = await loadNav(false);
    expect(findActiveNav('/admin')?.group.id).toBe('home');
    expect(findActiveNav('/admin/events')?.group.id).toBe('content');
    expect(findActiveNav('/admin/media')?.group.id).toBe('media');
    expect(findActiveNav('/admin/booking-inquiries')?.item.label).toBe('Booking Inquiries');
    expect(findActiveNav('/admin/eventsx')).toBeNull();
  });
});
