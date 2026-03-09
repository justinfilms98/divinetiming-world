'use client';

import { useState, useEffect } from 'react';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';

export interface UnifiedHeroProps {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | string | null;
  /** Poster image URL for video (shows immediately, improves LCP) */
  posterUrl?: string | null;
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
  full: 'min-h-screen min-h-[100dvh]',
  tall: 'aspect-[16/9] min-h-[320px] w-full',
  standard: 'aspect-[16/9] min-h-[280px] w-full',
  compact: 'min-h-[160px] aspect-[3/1] w-full max-h-[200px]',
};

export function UnifiedHero({
  mediaUrl,
  mediaType,
  posterUrl,
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

  const url = mediaUrl ?? undefined;
  const type = (mediaType === 'image' || mediaType === 'video' ? mediaType : null) ?? 'default';

  return (
    <section
      className={`relative w-full overflow-hidden rounded-b-2xl ${heightPreset === 'full' ? 'rounded-b-none' : ''}`}
    >
      {/* Fixed aspect/min-height to avoid CLS */}
      <div className={`relative ${heightClasses[heightPreset]}`}>
        <div className="absolute inset-0">
          <MediaAssetRenderer
            url={url || null}
            mediaType={type}
            poster={posterUrl ?? null}
            fallback={HeroEclipseFallback}
            priority={true}
            sizes={heightPreset === 'full' ? '100vw' : '(max-width: 768px) 100vw, 1600px'}
          />

          {/* Phase D: single balanced overlay — bottom vignette + light center gradient for readability */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"
            style={{ opacity: Math.min(1, opacity * 1.1) }}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,transparent_40%,rgba(0,0,0,0.2)_100%)]"
            style={{ opacity: opacity * 0.9 }}
          />
          <div className="hero-grain" aria-hidden="true" />
        </div>

        {/* Content */}
        <div
          className={`absolute inset-0 flex flex-col justify-center px-6 md:px-12 ${
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
          {children}

          {showScrollCue && !reducedMotion && (
            <motion.div
              className="absolute bottom-6 left-1/2 -translate-x-1/2"
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
      </div>
    </section>
  );
}
