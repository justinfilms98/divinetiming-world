'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_ROTATION_MS = 8000;
const MIN_ROTATION_MS = 4000;
const FADE_MS = 800;

export interface HeroVideoItem {
  url: string;
  posterUrl?: string;
}

export interface HeroVideoCarouselPremiumProps {
  videos: HeroVideoItem[];
  overlayOpacity?: number;
  heightPreset?: 'full' | 'tall' | 'standard';
  showScrollCue?: boolean;
  /** Dev-only: show debug overlay when set (e.g. "Phase 17.D") */
  devLogLabel?: string;
  children?: React.ReactNode;
}

const heightClasses = {
  full: 'min-h-[100vh] w-full',
  tall: 'aspect-[16/9] min-h-[320px] w-full',
  standard: 'aspect-[16/9] min-h-[280px] w-full',
};

export function HeroVideoCarouselPremium({
  videos,
  overlayOpacity = 0.5,
  heightPreset = 'full',
  showScrollCue = false,
  devLogLabel,
  children,
}: HeroVideoCarouselPremiumProps) {
  const [frontIndex, setFrontIndex] = useState(0);
  const [frontIsA, setFrontIsA] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [devTick, setDevTick] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationMapRef = useRef<Record<string, number>>({});
  const frontIndexRef = useRef(0);
  const isFadingRef = useRef(false);
  const pendingSwapRef = useRef<{ nextIndex: number } | null>(null);
  const canplayRef = useRef<{ a: boolean; b: boolean }>({ a: false, b: false });
  const videosRef = useRef(videos);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  videosRef.current = videos;
  isFadingRef.current = isFading;

  const total = videos.length;
  frontIndexRef.current = frontIndex;
  const nextIndex = total > 1 ? (frontIndex + 1) % total : 0;

  function warmVideo(el: HTMLVideoElement): Promise<void> {
    if (el.readyState >= 3) return Promise.resolve();
    try {
      const t = el.duration ? Math.min(0.05, el.duration - 0.05) : 0.05;
      el.currentTime = Math.max(0, t);
    } catch {
      el.currentTime = 0.05;
    }
    return el.play().then(() => el.pause()).catch(() => {});
  }

  function waitForReady(el: HTMLVideoElement, timeoutMs = 1200): Promise<boolean> {
    if (el.readyState >= 3) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('playing', onReady);
        el.removeEventListener('error', onDone);
        if (tid !== null) clearTimeout(tid);
        resolve(ok);
      };
      const onReady = () => done(true);
      const onDone = () => done(false);
      el.addEventListener('canplay', onReady);
      el.addEventListener('playing', onReady);
      el.addEventListener('error', onDone);
      const tid = setTimeout(() => done(false), timeoutMs);
    });
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && devLogLabel) {
      console.log(`[${devLogLabel}] carousel received videos.length:`, total);
    }
  }, [total, devLogLabel]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    handler();
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Passive guard: only clamp index when total changes (e.g. slots removed). Never run on wrap.
  useEffect(() => {
    if (total > 0) setFrontIndex((i) => (i >= total ? 0 : i));
  }, [total]);

  const scheduleNextRef = useRef<(forIndex: number) => void>(() => {});

  const goToNext = useCallback(async () => {
    if (total <= 1) return;
    if (isFadingRef.current) return;
    const next = (frontIndexRef.current + 1) % total;
    const backEl = frontIsA ? videoBRef.current : videoARef.current;
    if (!backEl) {
      scheduleNextRef.current?.(next);
      return;
    }
    if (process.env.NODE_ENV === 'development') setDevTick((t) => t + 1);
    canplayRef.current = { a: false, b: false };
    pendingSwapRef.current = { nextIndex: next };

    if (reducedMotion) {
      warmVideo(backEl).catch(() => {});
      await waitForReady(backEl, 1500).catch(() => false);
      setFrontIndex((i) => (i + 1) % total);
      setFrontIsA((a) => !a);
      pendingSwapRef.current = null;
      scheduleNextRef.current?.(next);
      return;
    }

    await warmVideo(backEl);
    await waitForReady(backEl, 1500).catch(() => false);

    setIsFading(true);
    swapTimeoutRef.current = setTimeout(() => {
      setFrontIndex((i) => (i + 1) % total);
      setFrontIsA((a) => !a);
      setIsFading(false);
      pendingSwapRef.current = null;
      scheduleNextRef.current?.(next);
      if (swapTimeoutRef.current) {
        clearTimeout(swapTimeoutRef.current);
        swapTimeoutRef.current = null;
      }
    }, FADE_MS);
  }, [total, reducedMotion, frontIsA]);

  const scheduleNext = useCallback((forIndex: number) => {
    const list = videosRef.current;
    const activeUrl = list[forIndex]?.url;
    const durSec = activeUrl ? durationMapRef.current[activeUrl] ?? 0 : 0;
    const durMs = durSec > 0 ? Math.floor(durSec * 1000) : DEFAULT_ROTATION_MS;
    const waitMs = Math.max(MIN_ROTATION_MS, durMs);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      goToNext();
    }, waitMs);
  }, [goToNext]);

  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  useEffect(() => {
    if (total <= 1) return;
    scheduleNextRef.current?.(0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    };
  }, [total]);

  if (total === 0) return null;

  const indexA = frontIsA ? frontIndex : nextIndex;
  const indexB = frontIsA ? nextIndex : frontIndex;
  const videoA = videos[indexA];
  const videoB = videos[indexB];
  const showTransition = !reducedMotion;
  const opacityA = frontIsA ? (isFading ? 0 : 1) : (isFading ? 1 : 0);
  const opacityB = frontIsA ? (isFading ? 1 : 0) : (isFading ? 0 : 1);

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl bg-black ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
    >
      <div className={`relative w-full ${heightClasses[heightPreset]}`}>
        <div className="absolute inset-0">
          {total === 1 ? (
            <video
              key="single"
              src={videoA!.url}
              poster={videoA!.posterUrl}
              muted
              autoPlay
              playsInline
              loop
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoARef}
                key={videoA!.url}
                src={videoA!.url}
                poster={videoA!.posterUrl}
                muted
                autoPlay
                playsInline
                loop={false}
                preload="auto"
                controls={false}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate"
                crossOrigin="anonymous"
                onLoadedMetadata={(e) => {
                  const url = videoA!.url;
                  durationMapRef.current[url] = e.currentTarget.duration ?? 0;
                }}
                onCanPlay={() => {
                  canplayRef.current.a = true;
                }}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: opacityA,
                  zIndex: opacityA >= 0.5 ? 1 : 0,
                  transition: showTransition ? `opacity ${FADE_MS}ms ease-out` : undefined,
                }}
              />
              <video
                ref={videoBRef}
                key={videoB!.url}
                src={videoB!.url}
                poster={videoB!.posterUrl}
                muted
                autoPlay
                playsInline
                loop={false}
                preload="auto"
                controls={false}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate"
                crossOrigin="anonymous"
                onLoadedMetadata={(e) => {
                  const url = videoB!.url;
                  durationMapRef.current[url] = e.currentTarget.duration ?? 0;
                }}
                onCanPlay={() => {
                  canplayRef.current.b = true;
                }}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: opacityB,
                  zIndex: opacityB >= 0.5 ? 1 : 0,
                  transition: showTransition ? `opacity ${FADE_MS}ms ease-out` : undefined,
                }}
              />
            </>
          )}

          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35"
            style={{ opacity: Math.min(1, overlayOpacity * 1.2), pointerEvents: 'none' }}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.25)_100%)]"
            style={{ opacity: overlayOpacity * 0.8, pointerEvents: 'none' }}
          />
          <div className="hero-grain absolute inset-0 pointer-events-none" aria-hidden />
        </div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 md:px-12 z-[1] overflow-hidden min-w-0 pointer-events-none">
          <div className="pointer-events-auto">{children}</div>
        </div>

        {showScrollCue && !reducedMotion && total > 1 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1] pointer-events-none"
            aria-hidden
          >
            <div className="flex flex-col items-center gap-1 text-white/60 text-xs tracking-widest uppercase">
              Scroll
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        )}

        {devLogLabel && process.env.NODE_ENV === 'development' && (
          <div
            className="absolute top-3 left-3 z-[2] px-2 py-1.5 rounded bg-black/80 text-green-400 font-mono text-xs pointer-events-none"
            aria-hidden
          >
            <div>{devLogLabel}</div>
            <div>videos: {total}</div>
            <div>active: {frontIndex}</div>
            <div>tick: {devTick}</div>
            <div>
              ready A: {videoARef.current?.readyState ?? 'na'} canplay: {canplayRef.current.a ? 'Y' : 'n'}
            </div>
            <div>
              ready B: {videoBRef.current?.readyState ?? 'na'} canplay: {canplayRef.current.b ? 'Y' : 'n'}
            </div>
            <div title={videoA?.url ?? ''} className="truncate max-w-[200px]">
              {videoA?.url ? videoA.url.replace(/^.*\//, '').slice(0, 30) : '—'}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
