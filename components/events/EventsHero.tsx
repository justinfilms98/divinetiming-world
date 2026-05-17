'use client';

import { useState, useEffect } from 'react';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';

interface EventsHeroProps {
  mediaType?: string | null;
  mediaUrl?: string | null;
  overlayOpacity?: number;
  headline: string;
  subtext?: string | null;
}

export function EventsHero({
  mediaType,
  mediaUrl,
  overlayOpacity = 0.5,
  headline,
  subtext,
}: EventsHeroProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <section className="relative w-full h-[40vh] min-h-[280px] overflow-hidden">
      {/* Background media */}
      <div className="absolute inset-0">
        <MediaAssetRenderer
          url={mediaUrl ?? null}
          mediaType={mediaType ?? 'default'}
          fallback={HeroEclipseFallback}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70"
          style={{ opacity }}
        />
      </div>

      {/* Content - rounded lower corners container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 rounded-b-3xl overflow-hidden">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {headline.toUpperCase()}
        </motion.h1>
        {subtext && (
          <motion.p
            className="text-white/80 text-lg mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            {subtext}
          </motion.p>
        )}

        {/* Scroll indicator */}
        {!reducedMotion && (
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
    </section>
  );
}
