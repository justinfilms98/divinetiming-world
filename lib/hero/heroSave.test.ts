import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';
import { buildHeroUpdate, HERO_INSERT_DEFAULTS } from './heroSave';
import { clearHeroSlot, emptyHeroSlot, heroSlotAt, heroSlotState, resolveHeroSlots, withHeroSlot } from './heroSlots';
import { LIVE_HOME_SLOTS } from '@/test/fixtures/heroHome';
import type { HeroSlot } from '@/lib/types/content';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST } = await import('@/app/api/admin/hero/route');

/** The home row as the owner meant it to be: logo, overlay, copy and CTA all set. */
const HOME_ROW = {
  id: 'home-row',
  page_slug: 'home',
  media_type: 'default',
  media_url: null,
  media_storage_path: null,
  external_media_asset_id: null,
  hero_logo_url: 'https://example.supabase.co/storage/v1/object/public/media/library/1794269961154-DT_LOGO_W.png',
  hero_logo_storage_path: null,
  overlay_opacity: 0.55,
  label_text: 'ELECTRONIC DUO',
  headline: 'DIVINE:TIMING',
  subtext: 'We are one.',
  cta_text: 'Listen',
  cta_url: '/music',
  animation_type: 'warp',
  animation_enabled: true,
  hero_slots: LIVE_HOME_SLOTS,
  updated_at: '2026-11-10T00:00:00Z',
};

let db: FakeDb;

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/admin/hero', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function homeRow() {
  return db.tables.hero_sections!.find((r) => r.page_slug === 'home')!;
}

function withoutSlotsAndTimestamp(row: Record<string, unknown>) {
  const rest = { ...row };
  delete rest.hero_slots;
  delete rest.updated_at;
  return rest;
}

beforeEach(() => {
  db = createFakeDb({ hero_sections: [HOME_ROW] });
  auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
});

describe('POST /api/admin/hero — slot saves are partial', () => {
  it('saving only the slots leaves every other hero field unchanged', async () => {
    const before = withoutSlotsAndTimestamp(homeRow());
    const res = await post({ page_slug: 'home', hero_slots: clearHeroSlot(LIVE_HOME_SLOTS, 2) });
    expect(res.status).toBe(200);
    expect(withoutSlotsAndTimestamp(homeRow())).toEqual(before);
  });

  it('uploading to a slot keeps the logo, overlay, label, subtext and CTA', async () => {
    const video: HeroSlot = { ...emptyHeroSlot(2), enabled: true, media_type: 'video', video_url: 'https://example.com/new.mp4' };
    const res = await post({ page_slug: 'home', hero_slots: withHeroSlot(LIVE_HOME_SLOTS, 2, video) });
    expect(res.status).toBe(200);
    const row = homeRow();
    expect(row).toMatchObject({
      hero_logo_url: HOME_ROW.hero_logo_url,
      overlay_opacity: 0.55,
      label_text: 'ELECTRONIC DUO',
      subtext: 'We are one.',
      cta_text: 'Listen',
      cta_url: '/music',
    });
    const slots = row.hero_slots as HeroSlot[];
    expect(slots.map((s) => s.slot_index)).toEqual([1, 2, 3]);
    expect(heroSlotState(slots[1]).kind).toBe('active');
    expect(slots[0]).toMatchObject({ image_url: LIVE_HOME_SLOTS[0]!.image_url });
  });

  it('returns only the saved row so the editor can merge slots without touching unsaved edits', async () => {
    const res = await post({ page_slug: 'home', hero_slots: LIVE_HOME_SLOTS });
    const json = await res.json();
    expect(json.hero.hero_logo_url).toBe(HOME_ROW.hero_logo_url);
    expect(json.hero.hero_slots).toHaveLength(3);
  });
});

describe('POST /api/admin/hero — emptied slots stay empty', () => {
  it('an emptied slot is still empty after several reloads and later unrelated saves', async () => {
    await post({ page_slug: 'home', hero_slots: clearHeroSlot(clearHeroSlot(LIVE_HOME_SLOTS, 2), 3) });
    for (let reload = 0; reload < 3; reload++) {
      const slots = homeRow().hero_slots as HeroSlot[];
      expect(heroSlotState(heroSlotAt(slots, 2)).kind).toBe('empty');
      expect(heroSlotState(heroSlotAt(slots, 3)).kind).toBe('empty');
      expect(resolveHeroSlots(slots)).toHaveLength(1);
      expect(JSON.stringify(slots)).not.toMatch(/hero_[23]\.mp4/);
      // An unrelated save between reloads must not bring the videos back.
      await post({ page_slug: 'home', subtext: `We are one. (${reload})` });
    }
  });
});

describe('POST /api/admin/hero — full Save and validation', () => {
  it('a full Save still writes every field it sends, including clearing the logo', async () => {
    const res = await post({ page_slug: 'home', hero_logo_url: null, hero_logo_storage_path: null, overlay_opacity: 0.3, subtext: null });
    expect(res.status).toBe(200);
    expect(homeRow()).toMatchObject({ hero_logo_url: null, overlay_opacity: 0.3, subtext: null, cta_text: 'Listen' });
  });

  it('rejects a CTA URL without a label (checked against the saved label when only the URL is sent)', async () => {
    db.tables.hero_sections![0]!.cta_text = null;
    const res = await post({ page_slug: 'home', cta_url: '/booking' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/CTA label/);
    expect(homeRow().cta_url).toBe('/music');
  });

  it('rejects an invalid logo URL without changing anything', async () => {
    const res = await post({ page_slug: 'home', hero_logo_url: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
    expect(homeRow().hero_logo_url).toBe(HOME_ROW.hero_logo_url);
  });

  it('applies defaults only when creating a page hero for the first time', async () => {
    const res = await post({ page_slug: 'shop', headline: 'Shop' });
    expect(res.status).toBe(200);
    expect(db.tables.hero_sections!.find((r) => r.page_slug === 'shop')).toMatchObject({ ...HERO_INSERT_DEFAULTS, headline: 'Shop' });
  });

  it('reports a database failure as an error, never as success', async () => {
    db.failOn = (op) => (op === 'update' ? { message: 'boom' } : null);
    const res = await post({ page_slug: 'home', hero_slots: LIVE_HOME_SLOTS });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });

  it('refuses signed-out and non-admin requests before touching the database', async () => {
    for (const status of [401, 403]) {
      const { NextResponse } = await import('next/server');
      auth.result = { error: NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }) };
      const res = await post({ page_slug: 'home', hero_slots: [] });
      expect(res.status).toBe(status);
    }
    expect(db.calls).toHaveLength(0);
    expect(homeRow().hero_slots).toEqual(LIVE_HOME_SLOTS);
  });
});

describe('buildHeroUpdate', () => {
  it('includes only the fields present in the request', () => {
    const r = buildHeroUpdate({ page_slug: 'home', hero_slots: [] });
    expect(r.ok && Object.keys(r.update).sort()).toEqual(['hero_slots', 'updated_at']);
  });

  it('accepts the nested { pageKey, hero } shape and percent overlays', () => {
    const r = buildHeroUpdate({ pageKey: 'events', hero: { overlayOpacity: 55 } });
    expect(r).toMatchObject({ ok: true, slug: 'events', update: { overlay_opacity: 0.55 } });
    expect(r.ok && 'hero_logo_url' in r.update).toBe(false);
  });

  it('rejects non-text values for text columns', () => {
    expect(buildHeroUpdate({ page_slug: 'home', subtext: 42 })).toMatchObject({ ok: false });
  });
});
