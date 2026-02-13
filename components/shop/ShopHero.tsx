'use client';

import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';

interface ShopHeroProps {
  mediaType?: string | null;
  mediaUrl?: string | null;
  overlayOpacity?: number;
  headline: string;
  tagline?: string | null;
}

export function ShopHero({
  mediaType,
  mediaUrl,
  overlayOpacity = 0.5,
  headline,
  tagline,
}: ShopHeroProps) {
  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <section className="relative w-full h-[35vh] min-h-[240px] overflow-hidden rounded-b-2xl">
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
          className="text-4xl md:text-6xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {headline.toUpperCase()}
        </motion.h1>
        {tagline && (
          <motion.p
            className="text-white/80 text-lg mt-3 font-light tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            {tagline}
          </motion.p>
        )}
      </div>
    </section>
  );
}
