import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HeroSection, HeroSlot, HeroSlotIndex } from '@/lib/types/content';
import { normalizeHeroSlots } from '@/lib/content/shared';
import { getHeroAllSlots } from '@/lib/content/heroSingleSource';
import { createHeroCarousel, HERO_IMAGE_HOLD_MS, HERO_VIDEO_MAX_MS, type HeroSlideKind } from './heroCarousel';
import {
  activeHeroSlotCount,
  clearHeroSlot,
  emptyHeroSlot,
  heroMediaKind,
  heroSlotAt,
  heroSlotFromMedia,
  heroSlotState,
  resolveHeroSlots,
  setHeroSlotEnabled,
  withHeroSlot,
} from './heroSlots';

const LIB = 'https://example.supabase.co/storage/v1/object/public/media/library';

type SlotSpec = 'empty' | 'image-on' | 'image-off' | 'video-on' | 'video-off';
const SPECS: SlotSpec[] = ['empty', 'image-on', 'image-off', 'video-on', 'video-off'];

function slotFor(spec: SlotSpec, n: number): HeroSlot {
  if (spec === 'empty') return emptyHeroSlot(n as HeroSlotIndex);
  const [kind, on] = spec.split('-') as ['image' | 'video', 'on' | 'off'];
  const slot = heroSlotFromMedia(n, `${LIB}/slot${n}.${kind === 'image' ? 'jpg' : 'mp4'}`)!;
  return { ...slot, enabled: on === 'on' };
}

/** Exactly what app/page.tsx does: stored slots → resolved → carousel slides. */
function publicSlides(stored: HeroSlot[]) {
  const normalized = normalizeHeroSlots(stored);
  if (!Array.isArray(normalized)) throw new Error(normalized.error);
  return getHeroAllSlots({ hero_slots: resolveHeroSlots(normalized) ?? undefined } as unknown as HeroSection);
}

const ALL_COMBOS: SlotSpec[][] = SPECS.flatMap((a) => SPECS.flatMap((b) => SPECS.map((c) => [a, b, c])));

describe('every combination of the three slots (125 cases)', () => {
  it.each(ALL_COMBOS.map((specs) => [specs.join(' | '), specs] as const))('%s', (_name, specs) => {
    const stored = specs.map((s, i) => slotFor(s, i + 1));
    const slides = publicSlides(stored);
    const expected = specs
      .map((s, i) => ({ s, n: i + 1 }))
      .filter(({ s }) => s.endsWith('-on'))
      .map(({ s, n }) => ({ mediaType: s.startsWith('image') ? 'image' : 'video', mediaUrl: `${LIB}/slot${n}.${s.startsWith('image') ? 'jpg' : 'mp4'}` }));

    // Only switched-on slots with media become slides, in slot order, never blank.
    expect(slides.map((x) => ({ mediaType: x.mediaType, mediaUrl: x.mediaUrl }))).toEqual(expected);
    expect(slides.every((x) => !!x.mediaUrl)).toBe(true);
    // The admin's "Single hero / Slideshow · N" badge matches what the homepage shows.
    expect(activeHeroSlotCount(stored)).toBe(expected.length);
  });

  it('covers the configurations Lex and Liam may choose', () => {
    const cases: [SlotSpec[], string][] = [
      [['image-on', 'empty', 'empty'], 'image'],
      [['video-on', 'empty', 'empty'], 'video'],
      [['image-on', 'image-on', 'empty'], 'image,image'],
      [['video-on', 'video-on', 'empty'], 'video,video'],
      [['image-on', 'image-on', 'image-on'], 'image,image,image'],
      [['video-on', 'video-on', 'video-on'], 'video,video,video'],
      [['image-on', 'video-on', 'video-on'], 'image,video,video'],
      [['image-on', 'image-on', 'video-on'], 'image,image,video'],
      [['empty', 'video-on', 'image-on'], 'video,image'],
    ];
    for (const [specs, kinds] of cases) {
      expect(publicSlides(specs.map((s, i) => slotFor(s, i + 1))).map((s) => s.mediaType).join(',')).toBe(kinds);
    }
  });
});

describe('per-slot controls', () => {
  const three = () => [slotFor('image-on', 1), slotFor('video-on', 2), slotFor('video-on', 3)];

  it('hiding a slot keeps its media; showing it again brings it back', () => {
    const hidden = setHeroSlotEnabled(three(), 2, false);
    expect(heroSlotState(hidden[1])).toMatchObject({ kind: 'off', mediaType: 'video' });
    expect(hidden[1]!.video_url).toBe(`${LIB}/slot2.mp4`);
    expect(publicSlides(hidden)).toHaveLength(2);
    const shown = setHeroSlotEnabled(hidden, 2, true);
    expect(heroSlotState(shown[1]).kind).toBe('active');
    expect(publicSlides(shown)).toHaveLength(3);
  });

  it('switching on an empty slot does nothing, so it can never become a blank slide', () => {
    const next = setHeroSlotEnabled([slotFor('image-on', 1)], 3, true);
    expect(heroSlotState(heroSlotAt(next, 3)).kind).toBe('empty');
    expect(heroSlotAt(next, 3)!.enabled).toBe(false);
    expect(publicSlides(next)).toHaveLength(1);
  });

  it('removing media empties only that slot and keeps the others in place', () => {
    const next = clearHeroSlot(three(), 1);
    expect(next.map((s) => heroSlotState(s).kind)).toEqual(['empty', 'active', 'active']);
    expect(publicSlides(next).map((s) => s.mediaUrl)).toEqual([`${LIB}/slot2.mp4`, `${LIB}/slot3.mp4`]);
  });

  it('changing a slot from image to video (and back) clears the old type', () => {
    const toVideo = withHeroSlot(three(), 1, heroSlotFromMedia(1, `${LIB}/new.mp4`, 'video/mp4')!);
    expect(toVideo[0]).toMatchObject({ media_type: 'video', video_url: `${LIB}/new.mp4`, image_url: null, enabled: true });
    const toImage = withHeroSlot(toVideo, 1, heroSlotFromMedia(1, `${LIB}/new.webp`, 'image/webp')!);
    expect(toImage[0]).toMatchObject({ media_type: 'image', image_url: `${LIB}/new.webp`, video_url: null });
    expect(toImage.slice(1)).toEqual(three().slice(1));
  });

  it('detects image or video from the MIME type, else the extension, and rejects anything else', () => {
    expect(heroMediaKind(`${LIB}/a.bin`, 'video/quicktime')).toBe('video');
    expect(heroMediaKind(`${LIB}/a.MOV`)).toBe('video');
    expect(heroMediaKind(`${LIB}/a.jpeg?v=2`)).toBe('image');
    expect(heroMediaKind(`${LIB}/a.pdf`, 'application/pdf')).toBeNull();
    expect(heroSlotFromMedia(2, `${LIB}/a.pdf`, 'application/pdf')).toBeNull();
  });
});

describe('carousel playback for each mix of slides', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** Plays two full loops: images wait out their hold, videos report `ended`. */
  function playTwoLoops(kinds: HeroSlideKind[]) {
    const order: number[] = [];
    const c = createHeroCarousel({ kinds, imageHoldMs: HERO_IMAGE_HOLD_MS, videoMaxMs: HERO_VIDEO_MAX_MS, onChange: (i) => order.push(i) });
    c.start();
    for (let step = 0; step < kinds.length * 2; step++) {
      if (kinds[c.index] === 'video') {
        vi.advanceTimersByTime(3_000);
        c.slideEnded(c.index);
      } else {
        vi.advanceTimersByTime(HERO_IMAGE_HOLD_MS);
      }
    }
    c.destroy();
    return order;
  }

  it.each([
    [['image', 'image']],
    [['video', 'video']],
    [['image', 'video']],
    [['video', 'image']],
    [['image', 'image', 'image']],
    [['video', 'video', 'video']],
    [['image', 'video', 'video']],
    [['image', 'image', 'video']],
    [['video', 'image', 'video']],
  ] as HeroSlideKind[][][])('%j cycles through every slide and loops', (kinds) => {
    const order = playTwoLoops(kinds);
    const oneLoop = [...kinds.keys()].slice(1).concat(0);
    expect(order).toEqual([...oneLoop, ...oneLoop]);
  });

  it('a video that never reports ended still advances on the safety timer in a mixed slideshow', () => {
    const order: number[] = [];
    const c = createHeroCarousel({ kinds: ['image', 'video'], imageHoldMs: HERO_IMAGE_HOLD_MS, videoMaxMs: HERO_VIDEO_MAX_MS, onChange: (i) => order.push(i) });
    c.start();
    vi.advanceTimersByTime(HERO_IMAGE_HOLD_MS);
    expect(order).toEqual([1]);
    vi.advanceTimersByTime(HERO_VIDEO_MAX_MS);
    expect(order).toEqual([1, 0]);
    c.destroy();
  });

  it('a stalled video moves on to the next slide', () => {
    const order: number[] = [];
    const c = createHeroCarousel({ kinds: ['video', 'image', 'video'], imageHoldMs: HERO_IMAGE_HOLD_MS, videoMaxMs: HERO_VIDEO_MAX_MS, onChange: (i) => order.push(i) });
    c.start();
    c.slideStalled(0);
    expect(order).toEqual([1]);
    c.destroy();
  });

  it.each([[['image']], [['video']]] as HeroSlideKind[][][])('a single %j slide never transitions', (kinds) => {
    const order: number[] = [];
    const c = createHeroCarousel({ kinds, imageHoldMs: HERO_IMAGE_HOLD_MS, videoMaxMs: HERO_VIDEO_MAX_MS, onChange: (i) => order.push(i) });
    c.start();
    vi.advanceTimersByTime(HERO_VIDEO_MAX_MS * 10);
    c.slideEnded(0);
    expect(order).toEqual([]);
    c.destroy();
  });
});
