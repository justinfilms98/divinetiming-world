'use client';

import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';

interface HeroMediaProps {
  mediaType?: string | null;
  mediaUrl?: string | null;
  overlayOpacity?: number;
}

export function HeroMedia({ mediaType, mediaUrl, overlayOpacity = 0.4 }: HeroMediaProps) {
  const opacity = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <MediaAssetRenderer
        url={mediaUrl ?? null}
        mediaType={mediaType ?? 'default'}
        alt="DIVINE:TIMING"
        fallback={HeroEclipseFallback}
        priority
        sizes="100vw"
      />

      {/* Dark gradient overlay - adjustable opacity */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"
        style={{ opacity }}
      />
      <div
        className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50"
        style={{ opacity: opacity * 0.8 }}
      />

      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
