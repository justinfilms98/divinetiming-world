'use client';

import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';

interface AboutHeroProps {
  mediaType?: string | null;
  mediaUrl?: string | null;
  overlayOpacity?: number;
  headline: string;
  subtext?: string | null;
}

export function AboutHero({
  mediaType,
  mediaUrl,
  overlayOpacity = 0.5,
  headline,
  subtext,
}: AboutHeroProps) {
  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <section className="relative w-full h-[36vh] min-h-[260px] overflow-hidden rounded-b-2xl">
      <div className="absolute inset-0">
        <MediaAssetRenderer
          url={mediaUrl ?? null}
          mediaType={mediaType ?? 'default'}
          fallback={HeroEclipseFallback}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
          style={{ opacity }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ fontFamily: 'var(--font-playfair-display), serif' }}
        >
          {headline}
        </motion.h1>
        {subtext && (
          <motion.p
            className="text-white/80 text-lg mt-4 max-w-xl font-light"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            {subtext}
          </motion.p>
        )}
      </div>
    </section>
  );
}
