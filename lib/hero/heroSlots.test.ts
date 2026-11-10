import { describe, expect, it } from 'vitest';
import type { HeroSection, HeroSlot } from '@/lib/types/content';
import { normalizeHeroSlots } from '@/lib/content/shared';
import { getHeroAllSlots } from '@/lib/content/heroSingleSource';
import {
  activeHeroSlotCount,
  clearHeroSlot,
  emptyHeroSlot,
  heroSlotAt,
  heroSlotState,
  resolveHeroSlots,
  withHeroSlot,
} from './heroSlots';
import { LIVE_HOME_SLOTS } from '@/test/fixtures/heroHome';

const LIB = 'https://example.supabase.co/storage/v1/object/public/media/library';

function publicSlides(stored: unknown) {
  return getHeroAllSlots({ hero_slots: resolveHeroSlots(stored) ?? undefined } as unknown as HeroSection);
}

describe('admin slot state', () => {
  it('shows a switched-off slot as off (not as a live preview), so removed videos do not look like they came back', () => {
    expect(heroSlotState(LIVE_HOME_SLOTS[0]).kind).toBe('active');
    expect(heroSlotState(LIVE_HOME_SLOTS[1])).toMatchObject({ kind: 'off', mediaType: 'video' });
    expect(heroSlotState(LIVE_HOME_SLOTS[2]).kind).toBe('off');
    expect(activeHeroSlotCount(LIVE_HOME_SLOTS)).toBe(1);
  });

  it('treats a slot with no media as empty even if it is switched on', () => {
    expect(heroSlotState({ ...emptyHeroSlot(2), enabled: true }).kind).toBe('empty');
    expect(heroSlotState(null).kind).toBe('empty');
  });

  it('finds slots by slot_index, so an older compacted array maps to the right card', () => {
    const compacted = [LIVE_HOME_SLOTS[0]!, { ...LIVE_HOME_SLOTS[2]!, enabled: true }];
    expect(heroSlotAt(compacted, 2)).toBeNull();
    expect(heroSlotAt(compacted, 3)?.video_url).toContain('hero_3.mp4');
  });
});

describe('emptying a slot', () => {
  it('clears every media reference and switches the slot off, leaving the other slots untouched', () => {
    const next = clearHeroSlot(LIVE_HOME_SLOTS, 2);
    expect(next).toHaveLength(3);
    expect(next[1]).toEqual(emptyHeroSlot(2));
    expect(next[0]).toEqual(LIVE_HOME_SLOTS[0]);
    expect(next[2]).toEqual(LIVE_HOME_SLOTS[2]);
    expect(JSON.stringify(next[1])).not.toContain('hero_2.mp4');
  });

  it('keeps later slots in place through the server normalisation', () => {
    const cleared = normalizeHeroSlots(clearHeroSlot(clearHeroSlot(LIVE_HOME_SLOTS, 2), 3));
    expect(Array.isArray(cleared) && cleared.map((s) => [s.slot_index, heroSlotState(s).kind])).toEqual([
      [1, 'active'],
      [2, 'empty'],
      [3, 'empty'],
    ]);
  });
});

describe('uploading to a slot', () => {
  it('replaces only that slot and fills earlier gaps with empty placeholders', () => {
    const video: HeroSlot = { ...emptyHeroSlot(3), enabled: true, media_type: 'video', video_url: `${LIB}/new.mp4` };
    const next = withHeroSlot([LIVE_HOME_SLOTS[0]!], 3, video);
    expect(next.map((s) => s.slot_index)).toEqual([1, 2, 3]);
    expect(next[0]).toEqual(LIVE_HOME_SLOTS[0]);
    expect(heroSlotState(next[1]).kind).toBe('empty');
    expect(heroSlotState(next[2]).kind).toBe('active');
  });
});

describe('normalizeHeroSlots', () => {
  it('keeps an empty entry as an empty slot instead of shifting slot 3 into slot 2', () => {
    const out = normalizeHeroSlots([LIVE_HOME_SLOTS[0], null, { ...LIVE_HOME_SLOTS[2], enabled: true }]);
    expect(Array.isArray(out) && out.map((s) => s.slot_index)).toEqual([1, 2, 3]);
    expect(Array.isArray(out) && out[2]!.video_url).toContain('hero_3.mp4');
  });

  it('keeps an unset slot overlay unset rather than turning it into 0%', () => {
    const out = normalizeHeroSlots([{ ...LIVE_HOME_SLOTS[0], overlay_opacity: null }]);
    expect(Array.isArray(out) && out[0]!.overlay_opacity).toBeNull();
  });
});

describe('public homepage (single-image mode)', () => {
  it('renders exactly one slide for the live data: one image plus two switched-off videos', () => {
    const slides = publicSlides(LIVE_HOME_SLOTS);
    expect(slides).toHaveLength(1);
    expect(slides[0]).toMatchObject({ mediaType: 'image' });
  });

  it('still renders one slide, with no blank slides, after slots 2 and 3 are emptied', () => {
    const slides = publicSlides(clearHeroSlot(clearHeroSlot(LIVE_HOME_SLOTS, 2), 3));
    expect(slides).toHaveLength(1);
    expect(slides.every((s) => !!s.mediaUrl)).toBe(true);
  });

  it('never turns a switched-on slot without media into a blank slide', () => {
    expect(publicSlides([LIVE_HOME_SLOTS[0], { ...emptyHeroSlot(2), enabled: true }])).toHaveLength(1);
  });
});
