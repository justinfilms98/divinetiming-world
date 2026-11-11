import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeDb, fakeSupabase, type FakeDb } from '@/test/fakeSupabase';
import { LIVE_HOME_SLOTS } from '@/test/fixtures/heroHome';
import { isCurrentLogo, isLogoCompatible, LOGO_MAX_BYTES, withLogo } from './logoAssets';

const auth = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));
vi.mock('@/lib/admin/auth', () => ({ requireAdmin: vi.fn(async () => auth.result) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { POST } = await import('@/app/api/admin/hero/route');

const LIVE_LOGO = 'https://example.supabase.co/storage/v1/object/public/media/library/1794269961154-DT_LOGO_W.png';
const OTHER_LOGO = 'https://example.supabase.co/storage/v1/object/public/media/library/1773117115214-DT_LOGO_W.png';

/** The production home row after the D2-B owner settings. */
const HOME_ROW = {
  id: 'home-row',
  page_slug: 'home',
  media_type: 'default',
  media_url: null,
  media_storage_path: null,
  external_media_asset_id: null,
  hero_logo_url: LIVE_LOGO,
  hero_logo_storage_path: null,
  overlay_opacity: 0.4,
  label_text: null,
  headline: null,
  subtext: 'We are one.',
  cta_text: 'Listen',
  cta_url: '/music',
  secondary_cta_text: 'Join the tribe',
  secondary_cta_url: '/#tribe',
  animation_type: 'warp',
  animation_enabled: true,
  hero_slots: LIVE_HOME_SLOTS,
  updated_at: '2026-11-11T04:46:50Z',
};

const png = (over: Record<string, unknown> = {}) => ({
  mime_type: 'image/png',
  preview_url: OTHER_LOGO,
  size_bytes: 58566,
  width: null,
  is_archived: false,
  ...over,
});

describe('isLogoCompatible', () => {
  it('accepts a library PNG even when its dimensions were never recorded', () => {
    expect(isLogoCompatible(png())).toBe(true);
    expect(isLogoCompatible(png({ mime_type: 'IMAGE/PNG', width: 1200 }))).toBe(true);
  });

  it.each([
    ['a JPEG (no transparency)', { mime_type: 'image/jpeg' }],
    ['a video', { mime_type: 'video/mp4' }],
    ['an archived image', { is_archived: true }],
    ['an image over 2 MB', { size_bytes: LOGO_MAX_BYTES + 1 }],
    ['an image known to be narrower than 600 px', { width: 320 }],
    ['an address that is not https', { preview_url: 'http://example.com/logo.png' }],
  ])('rejects %s', (_name, over) => {
    expect(isLogoCompatible(png(over))).toBe(false);
  });
});

describe('withLogo', () => {
  it('changes only the logo, and clears the storage path that would otherwise win', () => {
    const before = { ...HOME_ROW, hero_logo_storage_path: 'library/old-logo.png' };
    const after = withLogo(before, OTHER_LOGO);
    expect(after).toEqual({ ...before, hero_logo_url: OTHER_LOGO, hero_logo_storage_path: null });
    expect(after.hero_slots).toBe(before.hero_slots);
  });
});

describe('isCurrentLogo', () => {
  it('marks the library item already in use', () => {
    expect(isCurrentLogo({ preview_url: LIVE_LOGO }, LIVE_LOGO)).toBe(true);
    expect(isCurrentLogo({ preview_url: OTHER_LOGO }, LIVE_LOGO)).toBe(false);
    expect(isCurrentLogo({ preview_url: LIVE_LOGO }, null)).toBe(false);
  });
});

describe('Saving a logo chosen from the library', () => {
  let db: FakeDb;
  beforeEach(() => {
    db = createFakeDb({ hero_sections: [structuredClone(HOME_ROW)] });
    auth.result = { supabase: fakeSupabase(db), user: { email: 'owner@example.com' } };
  });

  it('a full editor Save changes the logo and leaves slots, overlay, text and buttons exactly as they were', async () => {
    const edited = withLogo(structuredClone(HOME_ROW), OTHER_LOGO);
    const res = await POST(
      new NextRequest('http://localhost/api/admin/hero', {
        method: 'POST',
        body: JSON.stringify({ ...edited, page_slug: 'home' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(200);
    const after = db.tables.hero_sections![0]!;
    expect(after.hero_logo_url).toBe(OTHER_LOGO);
    expect(after.hero_logo_storage_path).toBeNull();
    for (const key of [
      'hero_slots',
      'overlay_opacity',
      'subtext',
      'label_text',
      'headline',
      'cta_text',
      'cta_url',
      'secondary_cta_text',
      'secondary_cta_url',
      'media_type',
      'media_url',
    ] as const) {
      expect(after[key]).toEqual(HOME_ROW[key]);
    }
  });
});
