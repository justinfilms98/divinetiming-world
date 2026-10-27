import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeroCarousel, nextAvailableIndex, type HeroSlideKind } from './heroCarousel';

const HOLD = 10_000;
const MAX = 16_000;

function setup(kinds: HeroSlideKind[] = ['video', 'video', 'video']) {
  const changes: number[] = [];
  const c = createHeroCarousel({ kinds, imageHoldMs: HOLD, videoMaxMs: MAX, onChange: (i) => changes.push(i) });
  c.start();
  return { c, changes };
}

describe('hero carousel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('advances when each video ends and loops back to the first', () => {
    const { c, changes } = setup();
    c.slideEnded(0);
    c.slideEnded(1);
    c.slideEnded(2);
    c.slideEnded(0);
    expect(changes).toEqual([1, 2, 0, 1]);
  });

  it('ignores ended events from slides that are not showing', () => {
    const { c, changes } = setup();
    c.slideEnded(2);
    expect(changes).toEqual([]);
    expect(c.index).toBe(0);
  });

  it('advances on the safety timer when a video never reports ended (autoplay blocked)', () => {
    const { changes } = setup();
    vi.advanceTimersByTime(MAX - 1);
    expect(changes).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual([1]);
    vi.advanceTimersByTime(MAX * 2);
    expect(changes).toEqual([1, 2, 0]);
  });

  it('holds image slides for the image interval', () => {
    const { changes } = setup(['image', 'video']);
    vi.advanceTimersByTime(HOLD);
    expect(changes).toEqual([1]);
  });

  it('skips a failed video and keeps skipping it on later loops', () => {
    const { c, changes } = setup();
    c.slideEnded(0); // -> 1
    c.slideFailed(1); // -> 2, slide 1 now excluded
    c.slideEnded(2); // -> 0 (loop)
    c.slideEnded(0); // -> 2, skipping failed 1
    expect(changes).toEqual([1, 2, 0, 2]);
  });

  it('a failure on a slide that is not showing is remembered without jumping', () => {
    const { c, changes } = setup();
    c.slideFailed(1);
    expect(changes).toEqual([]);
    c.slideEnded(0);
    expect(changes).toEqual([2]);
  });

  it('recovers from buffering by moving on when the showing video stalls', () => {
    const { c, changes } = setup();
    c.slideStalled(0);
    expect(changes).toEqual([1]);
  });

  it('stays put when every slide has failed instead of spinning', () => {
    const { c, changes } = setup();
    c.slideFailed(1);
    c.slideFailed(2);
    c.slideFailed(0);
    vi.advanceTimersByTime(MAX * 5);
    expect(changes).toEqual([]);
  });

  it('pause stops advancing until resumed', () => {
    const { c, changes } = setup();
    c.pause();
    c.slideEnded(0);
    vi.advanceTimersByTime(MAX * 3);
    expect(changes).toEqual([]);
    c.resume();
    vi.advanceTimersByTime(MAX);
    expect(changes).toEqual([1]);
  });

  it('manual selection restarts the timer for the chosen slide', () => {
    const { c, changes } = setup();
    vi.advanceTimersByTime(MAX - 1000);
    c.select(2);
    vi.advanceTimersByTime(MAX - 1);
    expect(changes).toEqual([2]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual([2, 0]);
  });

  it('a single slide never schedules advancement', () => {
    const { changes } = setup(['video']);
    vi.advanceTimersByTime(MAX * 3);
    expect(changes).toEqual([]);
  });
});

describe('nextAvailableIndex', () => {
  it('wraps and skips failed indices', () => {
    expect(nextAvailableIndex(2, 3, new Set())).toBe(0);
    expect(nextAvailableIndex(0, 3, new Set([1]))).toBe(2);
    expect(nextAvailableIndex(0, 3, new Set([0, 1, 2]))).toBeNull();
  });
});
