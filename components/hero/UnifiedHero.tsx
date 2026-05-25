'use client';

import { useState, useEffect } from 'react';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';
import type { HeroSingleSource } from '@/lib/content/heroSingleSource';

export interface UnifiedHeroProps {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | string | null;
  /** Poster image URL for video (shows immediately, improves LCP) */
  posterUrl?: string | null;
  /** Multiple slides for carousel mode */
  slides?: HeroSingleSource[];
  externalAsset?: { provider?: string; preview_url?: string; mime_type?: string | null } | null;
  overlayOpacity?: number;
  headline?: string | null;
  subtext?: string | null;
  align?: 'left' | 'center';
  heightPreset?: 'full' | 'tall' | 'standard' | 'compact';
  showScrollCue?: boolean;
  badge?: string | null;
  children?: React.ReactNode;
}

const heightClasses = {
  full: 'min-h-[calc(100dvh-var(--public-nav-height)-env(safe-area-inset-top,0px))]',
  tall: 'aspect-[16/9] min-h-[320px] w-full',
  standard: 'aspect-[16/9] min-h-[280px] w-full',
  compact: 'min-h-[160px] aspect-[3/1] w-full max-h-[200px]',
};

export function UnifiedHero({
  mediaUrl,
  mediaType,
  posterUrl,
  slides,
  overlayOpacity = 0.5,
  headline,
  subtext,
  align = 'center',
  heightPreset = 'standard',
  showScrollCue = false,
  badge,
  children,
}: UnifiedHeroProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const allSlides = (slides && slides.length > 0) ? slides : (mediaUrl ? [{ mediaUrl, mediaType: mediaType as 'image' | 'video' | null, posterUrl }] : []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flare, setFlare] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  // Mobile / touch devices throttle concurrent <video> autoplay (iOS hard-caps
  // at one) and burn battery + bandwidth when we mount three at once. Detect
  // touch / narrow viewports and downgrade to single-slide rendering there.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 768px)');
    const update = () => setIsCoarsePointer(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Crossfade tuning — long enough that two slides genuinely blend rather than swap.
  const HOLD_MS = 10_000;
  const CROSSFADE_MS = 2_400;

  // Carousel auto-advance. All slides are mounted simultaneously below and
  // only their opacity is toggled, so each video is already playing in the
  // background when its layer becomes active — no black flash possible.
  useEffect(() => {
    if (allSlides.length <= 1) return;
    const tick = setTimeout(() => {
      setFlare(true);
      setActiveIndex((prev) => (prev + 1) % allSlides.length);
      const clean = setTimeout(() => setFlare(false), CROSSFADE_MS);
      return () => clearTimeout(clean);
    }, HOLD_MS);
    return () => clearTimeout(tick);
  }, [activeIndex, allSlides.length]);

  const goToSlide = (target: number) => {
    if (target === activeIndex) return;
    setFlare(true);
    setActiveIndex(target);
    setTimeout(() => setFlare(false), CROSSFADE_MS);
  };

  const renderSlide = (slide: typeof allSlides[number] | undefined) => {
    if (!slide?.mediaUrl) return null;
    const t = (slide.mediaType === 'image' || slide.mediaType === 'video' ? slide.mediaType : null) ?? 'default';
    return (
      <MediaAssetRenderer
        url={slide.mediaUrl ?? null}
        mediaType={t}
        poster={slide.posterUrl ?? posterUrl ?? null}
        fallback={HeroEclipseFallback}
        priority
        sizes={heightPreset === 'full' ? '100vw' : '(max-width: 768px) 100vw, 1600px'}
      />
    );
  };

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
    >
      <div className={`relative ${heightClasses[heightPreset]}`}>
        <div className="absolute inset-0 bg-black">
          {/*
            Desktop: mount every slide as its own absolute-positioned layer
            and only toggle opacity. The videos preload + autoplay together so
            by the time a layer's opacity rises to 1 it's already running —
            no frozen first frame, no black flash.

            Mobile / coarse-pointer: only mount the active slide. iOS allows a
            single concurrent <video> autoplay and mounting three drains the
            battery + bandwidth. The lens flare overlay masks the swap.
          */}
          {isCoarsePointer ? (
            <div
              key={`hero-slide-mobile-${activeIndex}-${allSlides[activeIndex]?.mediaUrl ?? ''}`}
              className="absolute inset-0"
              style={{
                animation: `heroSlideFadeIn ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
                willChange: 'opacity',
              }}
            >
              {renderSlide(allSlides[activeIndex])}
            </div>
          ) : (
            allSlides.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={`hero-slide-${idx}-${slide?.mediaUrl ?? ''}`}
                  aria-hidden={!isActive}
                  className="absolute inset-0"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    zIndex: isActive ? 2 : 1,
                    willChange: 'opacity',
                  }}
                >
                  {renderSlide(slide)}
                </div>
              );
            })
          )}

          {/* Phase D: single balanced overlay — bottom vignette + light center gradient for readability */}
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/50 z-[5]"
            style={{ opacity: Math.min(1, opacity * 1.1) }}
          />
          <div
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,transparent_40%,rgba(0,0,0,0.2)_100%)] z-[5]"
            style={{ opacity: opacity * 0.9 }}
          />
          <div className="hero-grain" aria-hidden="true" />
          {flare && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(ellipse 55% 80% at 30% 50%, rgba(255,235,170,0.6) 0%, rgba(198,167,94,0.4) 25%, transparent 65%), linear-gradient(115deg, transparent 20%, rgba(255,225,160,0.45) 50%, transparent 80%)',
                animation: `lensFlareSweep ${CROSSFADE_MS}ms cubic-bezier(0.4,0,0.2,1) both`,
              }}
            />
          )}
        </div>

        {/* Content — pointer-events-none so taps reach the video play layer; re-enable on interactive children */}
        <div
          className={`absolute inset-0 z-10 flex flex-col justify-center px-6 md:px-12 pointer-events-none ${
            align === 'center' ? 'items-center text-center' : 'items-start text-left'
          }`}
        >
          {badge && (
            <motion.span
              className="type-hero-label text-white mb-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {badge}
            </motion.span>
          )}
          {headline && (
            <motion.h1
              className="type-hero-title text-white hero-text-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {headline}
            </motion.h1>
          )}
          {subtext && (
            <motion.p
              className={`text-white/90 text-lg mt-2 max-w-2xl leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              {subtext}
            </motion.p>
          )}
          {children && <div className="pointer-events-auto w-full">{children}</div>}

          {showScrollCue && !reducedMotion && (
            <motion.div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto"
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
          {allSlides.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-30 pointer-events-auto">
              {allSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'bg-[#C6A75E] w-4' : 'bg-white/40 w-1.5'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
