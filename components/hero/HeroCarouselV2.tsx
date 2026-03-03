'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmFlare } from '@/components/hero/FilmFlare';
import { HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import type { HeroSlotResolved } from '@/lib/types/content';

const INTERVAL_MS = 7000;
const FLARE_MS = 900;
const SWAP_AT_MS = 350;

const YOUTUBE_EMBED_PARAMS = 'controls=0&showinfo=0&rel=0&modestbranding=1&autoplay=1&mute=1&loop=1';

function EmbedIframe({ embedUrl, active }: { embedUrl: string; active: boolean }) {
  if (!active || !embedUrl) return null;
  const isYoutube = embedUrl.includes('youtube.com/embed');
  const src = isYoutube ? `${embedUrl}?${YOUTUBE_EMBED_PARAMS}&playlist=${embedUrl.split('/').pop() || ''}` : embedUrl;
  return (
    <iframe
      src={src}
      title="Hero embed"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full object-cover"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

export interface HeroCarouselV2Props {
  slots: HeroSlotResolved[];
  overlayOpacity?: number;
  heightPreset?: 'full' | 'tall' | 'standard' | 'compact';
  showScrollCue?: boolean;
  children?: React.ReactNode;
}

const heightClasses = {
  full: 'min-h-[100vh] md:min-h-[80vh]',
  tall: 'aspect-[16/9] min-h-[320px] w-full',
  standard: 'aspect-[16/9] min-h-[280px] w-full',
  compact: 'min-h-[160px] aspect-[3/1] w-full max-h-[200px]',
};

export function HeroCarouselV2({
  slots,
  overlayOpacity = 0.5,
  heightPreset = 'full',
  showScrollCue = false,
  children,
}: HeroCarouselV2Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'flare'>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slots.length;
  const isSingle = total <= 1;
  const currentSlot = total ? slots[activeIndex]! : null;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    const id = requestAnimationFrame(() => handler());
    mq.addEventListener('change', handler);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener('change', handler);
    };
  }, []);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setPhase('flare');
  }, [total]);

  useEffect(() => {
    if (phase !== 'idle' || total <= 1 || reducedMotion) return;
    intervalRef.current = setInterval(goNext, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, activeIndex, total, reducedMotion, goNext]);

  useEffect(() => {
    if (phase !== 'flare') return;
    const t1 = setTimeout(() => setActiveIndex((i) => (i + 1) % total), SWAP_AT_MS);
    const t2 = setTimeout(() => setPhase('idle'), FLARE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, total]);

  if (!total || !currentSlot) return null;

  const opacity = Math.max(0, Math.min(1, currentSlot.overlay_opacity ?? overlayOpacity));
  const showFlare = phase === 'flare';

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
    >
      <div className={`relative ${heightClasses[heightPreset]}`}>
        <div className="absolute inset-0">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={activeIndex}
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentSlot.media_type === 'embed' && currentSlot.resolved_embed_url ? (
                <EmbedIframe embedUrl={currentSlot.resolved_embed_url} active={true} />
              ) : currentSlot.media_type === 'video' && currentSlot.resolved_video_url ? (
                <video
                  src={currentSlot.resolved_video_url}
                  poster={currentSlot.resolved_poster_url ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : currentSlot.media_type === 'image' && currentSlot.resolved_image_url ? (
                <Image
                  src={currentSlot.resolved_image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={activeIndex === 0}
                  unoptimized={currentSlot.resolved_image_url.startsWith('blob:')}
                />
              ) : (
                <>{HeroEclipseFallback}</>
              )}
            </motion.div>
          </AnimatePresence>

          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60"
            style={{ opacity }}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35)_100%)]"
            style={{ opacity: opacity * 0.85 }}
          />
        </div>

        <FilmFlare active={showFlare && !isSingle} rounded={heightPreset !== 'full'} />

        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 md:px-12 z-[1] overflow-hidden min-w-0">
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
