'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Pause, Play } from 'lucide-react';
import {
  createHeroCarousel,
  HERO_IMAGE_HOLD_MS,
  HERO_VIDEO_MAX_MS,
  type HeroCarousel,
  type HeroSlideKind,
} from '@/lib/hero/heroCarousel';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';
import type { HeroSingleSource } from '@/lib/content/heroSingleSource';
import { heroArtDirectionFor } from '@/lib/media/heroArtDirection';
import { heroRenditionFor, pickHeroVariant, type HeroRendition, type HeroVariant } from '@/lib/media/heroRenditions';

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

// Phones get portrait-friendly shapes so people aren't cropped to a sliver; larger
// screens are capped by viewport height so a header never exceeds the first screen.
const heightClasses = {
  full: 'min-h-[calc(100dvh-var(--public-nav-height)-env(safe-area-inset-top,0px))]',
  tall: 'w-full aspect-[4/5] min-h-[320px] max-h-[74svh] md:aspect-[16/9] md:min-h-[400px] md:max-h-[82svh]',
  standard: 'w-full aspect-[4/5] min-h-[300px] max-h-[68svh] md:aspect-[16/9] md:min-h-[380px] md:max-h-[74svh]',
  // Utility pages (shop, media, contact, events listing).
  compact: 'w-full aspect-[5/4] min-h-[260px] max-h-[56svh] md:aspect-auto md:h-[clamp(420px,60svh,680px)] md:max-h-none',
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}
function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Decided once per page view: switching renditions on resize would download the clip again.
let cachedVariant: HeroVariant | null = null;
function getHeroVariant(): HeroVariant {
  if (!cachedVariant) {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    cachedVariant = pickHeroVariant({
      viewportWidth: window.innerWidth,
      saveData: conn?.saveData,
      effectiveType: conn?.effectiveType,
    });
  }
  return cachedVariant;
}
const subscribeNever = () => () => {};

function RenditionPoster({ rendition, priority }: { rendition: HeroRendition; priority: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- same file the video uses as its poster, so the handoff never refetches
    <img
      src={rendition.poster}
      srcSet={`${rendition.posterSmall} 1280w, ${rendition.poster} 1920w`}
      sizes="100vw"
      alt=""
      aria-hidden
      fetchPriority={priority ? 'high' : undefined}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: 'var(--hero-pos)' }}
    />
  );
}

/** Inline CSS variables consumed by `.hero-focal` (phone vs md+ crop anchor). */
function focalStyle(url: string | null | undefined, preset: string): React.CSSProperties {
  if (preset === 'full') return { ['--hero-pos-m' as string]: '50% 50%', ['--hero-pos-d' as string]: '50% 50%' };
  const art = heroArtDirectionFor(url);
  return { ['--hero-pos-m' as string]: art.mobile, ['--hero-pos-d' as string]: art.desktop };
}

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
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  const allSlides = (slides && slides.length > 0) ? slides : (mediaUrl ? [{ mediaUrl, mediaType: mediaType as 'image' | 'video' | null, posterUrl }] : []);
  const slideCount = allSlides.length;
  const isCarousel = slideCount > 1;
  // null on the server and during hydration: slides with renditions show their poster until
  // the browser has picked a rendition, so no video starts downloading before that choice.
  const variant = useSyncExternalStore(subscribeNever, getHeroVariant, () => null);
  const renditionOf = (s: (typeof allSlides)[number] | undefined) =>
    s?.mediaType === 'video' ? heroRenditionFor(s.mediaUrl) : null;
  const kindsKey = allSlides
    .map((s) => {
      if (variant === 'posters' && renditionOf(s)) return 'image';
      return s.mediaType === 'video' || s.mediaType === 'image' ? s.mediaType : 'other';
    })
    .join(',');
  const [activeIndex, setActiveIndex] = useState(0);
  // Outgoing slide stays mounted while it fades out, so the crossfade never shows black.
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  // Slides that have already played stay mounted (paused) so the next loop replays from the
  // element's buffer: the stored files are served with no-cache headers, so a remount
  // would download each clip again on every loop.
  const [visited, setVisited] = useState<number[]>([0]);
  const [activation, setActivation] = useState(0);
  const [flare, setFlare] = useState(false);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<HeroCarousel | null>(null);
  const prevIndexRef = useRef(0);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const CROSSFADE_MS = 2_400;

  // Videos advance when each clip ends (with a safety timer), failed/stalled slides are
  // skipped, and the sequence loops. Reduced motion still advances, but as an instant cut
  // with no lens flare; the Pause control stops it entirely (WCAG 2.2.2).
  useEffect(() => {
    if (!isCarousel) return;
    const carousel = createHeroCarousel({
      kinds: kindsKey.split(',') as HeroSlideKind[],
      imageHoldMs: HERO_IMAGE_HOLD_MS,
      videoMaxMs: HERO_VIDEO_MAX_MS,
      onChange: (next) => {
        const from = prevIndexRef.current;
        prevIndexRef.current = next;
        setActiveIndex(next);
        setActivation((n) => n + 1);
        setVisited((list) => (list.includes(next) ? list : [...list, next]));
        if (reducedMotionRef.current) return;
        setLeavingIndex(from);
        setFlare(true);
        window.setTimeout(() => {
          setFlare(false);
          setLeavingIndex((current) => (current === from ? null : current));
        }, CROSSFADE_MS);
      },
    });
    carouselRef.current = carousel;
    carousel.start();
    return () => {
      carousel.destroy();
      carouselRef.current = null;
    };
  }, [isCarousel, kindsKey]);

  const goToSlide = (target: number) => carouselRef.current?.select(target);

  const togglePaused = () => {
    const next = !paused;
    setPaused(next);
    if (next) carouselRef.current?.pause();
    else carouselRef.current?.resume();
  };

  // Only the showing slide plays and downloads; the next one preloads metadata.
  const standbyIndex = isCarousel ? (activeIndex + 1) % slideCount : null;

  const renderSlide = (
    slide: typeof allSlides[number] | undefined,
    slideIndex = 0,
    sizesOverride?: string,
    playing = true,
    restartToken?: number
  ) => {
    if (!slide?.mediaUrl) return null;
    const rendition = renditionOf(slide);
    if (rendition && !variant) {
      return (
        <div className="hero-focal absolute inset-0" style={focalStyle(slide.mediaUrl, heightPreset)}>
          <RenditionPoster rendition={rendition} priority={slideIndex === 0} />
        </div>
      );
    }
    let url: string = slide.mediaUrl;
    let t = (slide.mediaType === 'image' || slide.mediaType === 'video' ? slide.mediaType : null) ?? 'default';
    let poster = slide.posterUrl ?? posterUrl ?? null;
    if (rendition && variant === 'posters') {
      url = rendition.poster;
      t = 'image';
    } else if (rendition) {
      url = variant === 'mobile' ? rendition.mobile : rendition.desktop;
      poster = variant === 'mobile' ? rendition.posterSmall : rendition.poster;
    }
    return (
      <div className="hero-focal absolute inset-0" style={focalStyle(slide.mediaUrl, heightPreset)}>
        <MediaAssetRenderer
          url={url}
          mediaType={t}
          poster={poster}
          fallback={HeroEclipseFallback}
          objectPosition="var(--hero-pos)"
          priority={slideIndex === 0}
          sizes={sizesOverride ?? '100vw'}
          playing={playing}
          loop={!isCarousel}
          onEnded={() => carouselRef.current?.slideEnded(slideIndex)}
          onStalled={() => carouselRef.current?.slideStalled(slideIndex)}
          onError={() => carouselRef.current?.slideFailed(slideIndex)}
          restartToken={restartToken}
          holdUntilPlayable={!!rendition}
        />
      </div>
    );
  };

  const firstSlide = allSlides[0];
  const splitLayout =
    heightPreset !== 'full' &&
    allSlides.length === 1 &&
    firstSlide?.mediaType === 'image' &&
    heroArtDirectionFor(firstSlide.mediaUrl).desktopLayout === 'split';

  const textBottomLeft =
    heightPreset !== 'full' &&
    allSlides.length === 1 &&
    heroArtDirectionFor(firstSlide?.mediaUrl).desktopText === 'bottom-left';

  if (splitLayout && firstSlide) {
    return (
      <section className="band-night relative w-full overflow-hidden rounded-b-2xl md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative md:order-2 w-full aspect-[5/4] min-h-[260px] max-h-[56svh] md:aspect-auto md:max-h-none md:h-[clamp(440px,64svh,720px)]">
          {renderSlide(firstSlide, 0, '(max-width: 768px) 100vw, 50vw')}
          {/* Readability overlay only where text sits on the photo (phones). */}
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-black/25 to-black/55 md:hidden"
            style={{ opacity: Math.max(0.6, opacity) }}
          />
          <div className="hero-grain" aria-hidden="true" />
        </div>
        <div
          className={`absolute inset-0 z-10 flex flex-col justify-center px-6 pointer-events-none md:static md:order-1 md:px-12 lg:px-20 md:py-16 ${
            align === 'center' ? 'items-center text-center md:items-start md:text-left' : 'items-start text-left'
          }`}
        >
          {badge && <span className="type-hero-label text-white md:text-[var(--accent)] mb-3">{badge}</span>}
          {headline && <h1 className="type-hero-title text-white hero-text-shadow md:[text-shadow:none]">{headline}</h1>}
          {subtext && (
            <p className="text-white/90 md:text-[var(--text-on-dark-muted)] text-base md:text-lg mt-2 md:mt-4 max-w-md leading-relaxed">
              {subtext}
            </p>
          )}
          {children && <div className="pointer-events-auto w-full mt-6">{children}</div>}
        </div>
      </section>
    );
  }

  // No image or video assigned: a short title band instead of a large empty black box.
  if (allSlides.length === 0 && heightPreset !== 'full') {
    return (
      <section className="band-night relative w-full overflow-hidden">
        <div
          className={`relative z-10 flex flex-col px-6 md:px-12 pt-14 pb-12 md:pt-20 md:pb-16 ${
            align === 'center' ? 'items-center text-center' : 'items-start text-left'
          }`}
        >
          {badge && <span className="type-hero-label text-[var(--accent)] mb-3">{badge}</span>}
          {headline && <h1 className="type-hero-title text-[var(--text-on-dark)]">{headline}</h1>}
          {subtext && (
            <p className={`text-[var(--text-on-dark-muted)] text-base md:text-lg mt-3 max-w-2xl leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}>
              {subtext}
            </p>
          )}
          {children && <div className="w-full mt-6">{children}</div>}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
    >
      <div className={`relative ${heightClasses[heightPreset]}`}>
        <div className="absolute inset-0 bg-black">
          {/*
            Mounted layers: the showing slide (plays), the next slide (standby:
            metadata only, paused), the outgoing slide during a crossfade, and
            slides already played (paused, reused on the next loop).
            Never more than one video downloads in full at a time.
          */}
          {allSlides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            if (!isActive && idx !== standbyIndex && idx !== leavingIndex && !visited.includes(idx)) return null;
            return (
              <div
                key={`hero-slide-${idx}-${slide?.mediaUrl ?? ''}`}
                aria-hidden={!isActive}
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: reducedMotion ? 'none' : `opacity ${CROSSFADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  zIndex: isActive ? 2 : 1,
                  willChange: 'opacity',
                }}
              >
                {renderSlide(slide, idx, undefined, isActive && !paused, isActive ? activation : undefined)}
              </div>
            );
          })}

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
          } ${textBottomLeft ? 'md:justify-end md:items-start md:text-left md:pb-12 lg:px-20' : ''}`}
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
              className={`text-white/90 text-lg mt-2 max-w-2xl leading-relaxed ${align === 'center' ? 'mx-auto' : ''} ${textBottomLeft ? 'md:mx-0' : ''}`}
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
          {isCarousel && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={togglePaused}
                aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
                aria-pressed={paused}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:text-white focus-ring"
              >
                {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
              </button>
              {allSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  // 44px tap area around the small visual dot.
                  className="flex h-11 min-w-6 items-center justify-center px-1 focus-ring rounded-full"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === activeIndex ? 'true' : undefined}
                >
                  <span
                    aria-hidden
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'bg-[#C6A75E] w-4' : 'bg-white/40 w-1.5'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
