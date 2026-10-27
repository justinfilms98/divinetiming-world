/**
 * Homepage hero carousel controller (framework-free so it can be unit tested).
 *
 * - Video slides advance when the clip ends; a safety timer advances if `ended` never
 *   fires (autoplay blocked, very long clip). Image slides hold for `imageHoldMs`.
 * - A failed slide is skipped from then on; a stalled slide advances to the next one.
 * - After the last slide it loops to the first. If every slide has failed it stays put.
 */
export type HeroSlideKind = 'image' | 'video' | 'other';

export interface HeroCarouselOptions {
  kinds: HeroSlideKind[];
  imageHoldMs: number;
  videoMaxMs: number;
  onChange: (index: number) => void;
}

export interface HeroCarousel {
  readonly index: number;
  readonly paused: boolean;
  start(): void;
  slideEnded(index: number): void;
  slideFailed(index: number): void;
  slideStalled(index: number): void;
  select(index: number): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export const HERO_IMAGE_HOLD_MS = 10_000;
/** Current hero clips run ~10s; this only matters when `ended` never fires. */
export const HERO_VIDEO_MAX_MS = 16_000;

export function nextAvailableIndex(from: number, count: number, failed: ReadonlySet<number>): number | null {
  for (let step = 1; step <= count; step++) {
    const i = (from + step) % count;
    if (!failed.has(i)) return i;
  }
  return null;
}

export function createHeroCarousel({ kinds, imageHoldMs, videoMaxMs, onChange }: HeroCarouselOptions): HeroCarousel {
  const count = kinds.length;
  const failed = new Set<number>();
  let index = 0;
  let paused = false;
  let destroyed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const schedule = () => {
    clear();
    if (paused || destroyed || count <= 1) return;
    const ms = kinds[index] === 'video' ? videoMaxMs : imageHoldMs;
    timer = setTimeout(advance, ms);
  };

  const goTo = (target: number) => {
    if (destroyed) return;
    if (target !== index) {
      index = target;
      onChange(target);
    }
    schedule();
  };

  function advance() {
    const next = nextAvailableIndex(index, count, failed);
    if (next === null) {
      clear();
      return;
    }
    goTo(next);
  }

  return {
    get index() {
      return index;
    },
    get paused() {
      return paused;
    },
    start: schedule,
    slideEnded(i) {
      if (i === index && !paused) advance();
    },
    slideFailed(i) {
      failed.add(i);
      if (i === index) advance();
    },
    slideStalled(i) {
      if (i === index && !paused) advance();
    },
    select(i) {
      if (i >= 0 && i < count && !failed.has(i)) goTo(i);
    },
    pause() {
      paused = true;
      clear();
    },
    resume() {
      paused = false;
      schedule();
    },
    destroy() {
      destroyed = true;
      clear();
    },
  };
}
