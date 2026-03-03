'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import type { HeroCarouselSlide as Slide } from '@/lib/types/content';

const SLIDE_DURATION_VIDEO_MS = 12000;
const SLIDE_DURATION_IMAGE_MS = 7000;
const FADE_OUT_MS = 600;
const FLARE_MS = 500;
const FADE_IN_MS = 600;
const SWIPE_THRESHOLD_PX = 50;

function isYouTubeId(source: string): boolean {
  return source.length === 11 && /^[a-zA-Z0-9_-]+$/.test(source);
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;
  return (
    <iframe
      src={embedUrl}
      title="Hero video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
  );
}

export interface HeroCarouselProps {
  slides: Slide[];
  overlayOpacity?: number;
  heightPreset?: 'full' | 'tall' | 'standard' | 'compact';
  showScrollCue?: boolean;
  children?: React.ReactNode;
}

const heightClasses = {
  full: 'min-h-screen',
  tall: 'aspect-[16/9] min-h-[320px] w-full',
  standard: 'aspect-[16/9] min-h-[280px] w-full',
  compact: 'min-h-[160px] aspect-[3/1] w-full max-h-[200px]',
};

export function HeroCarousel({
  slides,
  overlayOpacity = 0.5,
  heightPreset = 'full',
  showScrollCue = false,
  children,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'flare' | 'fadeIn'>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = slides.length;
  const currentSlide = total ? slides[index]! : null;
  const isVideo = currentSlide?.type === 'video';
  const slideDurationMs = isVideo ? SLIDE_DURATION_VIDEO_MS : SLIDE_DURATION_IMAGE_MS;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setPhase('fadeOut');
  }, [total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX;
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null || endX == null || total <= 1) return;
    const diff = startX - endX;
    if (diff > SWIPE_THRESHOLD_PX) goNext();
    else if (diff < -SWIPE_THRESHOLD_PX) goPrev();
  }, [total, goNext, goPrev]);

  useEffect(() => {
    if (phase !== 'idle' || total <= 1 || reducedMotion) return;
    const t = setTimeout(goNext, slideDurationMs);
    return () => clearTimeout(t);
  }, [phase, index, total, slideDurationMs, reducedMotion, goNext]);

  useEffect(() => {
    if (phase !== 'fadeOut') return;
    const t = setTimeout(() => {
      setPhase('flare');
    }, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'flare') return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % total);
      setPhase('fadeIn');
    }, FLARE_MS);
    return () => clearTimeout(t);
  }, [phase, total]);

  useEffect(() => {
    if (phase !== 'fadeIn') return;
    const t = setTimeout(() => setPhase('idle'), FADE_IN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (!total || !currentSlide) {
    return null;
  }

  const opacity = Math.max(0, Math.min(1, overlayOpacity));
  const showFlare = phase === 'flare' || phase === 'fadeIn';

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`relative ${heightClasses[heightPreset]}`}>
        {/* Slide layer */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'fadeOut' ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: phase === 'fadeOut' ? FADE_OUT_MS / 1000 : FADE_IN_MS / 1000,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {currentSlide.type === 'video' && isYouTubeId(currentSlide.source) ? (
                <YouTubeEmbed videoId={currentSlide.source} />
              ) : currentSlide.type === 'video' ? (
                <MediaAssetRenderer
                  url={currentSlide.source}
                  mediaType="video"
                  fallback={HeroEclipseFallback}
                  priority={heightPreset === 'full'}
                  sizes={heightPreset === 'full' ? '100vw' : '(max-width: 768px) 100vw, 1600px'}
                />
              ) : currentSlide.type === 'image' ? (
                <MediaAssetRenderer
                  url={currentSlide.source}
                  mediaType="image"
                  fallback={HeroEclipseFallback}
                  priority={heightPreset === 'full'}
                  sizes={heightPreset === 'full' ? '100vw' : '(max-width: 768px) 100vw, 1600px'}
                />
              ) : (
                <>{HeroEclipseFallback}</>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Cinematic vignette + gradient overlay (soft, not heavy) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60"
            style={{ opacity }}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35)_100%)]"
            style={{ opacity: opacity * 0.85 }}
          />
        </div>

        {/* Camera flare overlay — only during transition */}
        {showFlare && (
          <div
            className="camera-flare-overlay z-10"
            key={`flare-${index}`}
            aria-hidden
          />
        )}

        {/* Content overlay — safe area, no overflow */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 md:px-12 z-[1] overflow-hidden min-w-0">
          {currentSlide.headline && (
            <motion.h1
              className="text-[clamp(2rem,8vw,4.5rem)] font-bold text-white tracking-tight max-w-4xl px-2"
              style={{ fontFamily: 'var(--font-headline)', lineHeight: 1.2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentSlide.headline}
            </motion.h1>
          )}
          {currentSlide.subtext && (
            <motion.p
              className="text-white/90 text-lg md:text-xl mt-2 max-w-2xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentSlide.subtext}
            </motion.p>
          )}
          {currentSlide.cta?.text && currentSlide.cta?.url && (
            <motion.a
              href={currentSlide.cta.url}
              className="mt-6 inline-block px-8 py-4 bg-[var(--accent)] text-[var(--text)] font-semibold rounded-md hover:bg-[var(--accent-hover)] transition-colors duration-300 focus-ring"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentSlide.cta.text}
            </motion.a>
          )}
          {children}
        </div>

        {showScrollCue && !reducedMotion && (
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-1 text-white/60"
            >
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
