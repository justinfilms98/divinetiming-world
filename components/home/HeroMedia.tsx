'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroMediaProps {
  mediaType?: string | null;
  mediaUrl?: string | null;
}

export function HeroMedia({ mediaType, mediaUrl }: HeroMediaProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  // Determine what to show
  const useVideo = mediaType === 'video' && mediaUrl && !hasError;
  const useImage = mediaType === 'image' && mediaUrl && !hasError;
  const useFallback = !useVideo && !useImage;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video */}
      {useVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setHasError(true)}
        >
          <source src={mediaUrl} type="video/mp4" />
          <source src={mediaUrl} type="video/webm" />
        </video>
      )}

      {/* Image */}
      {useImage && (
        <Image
          src={mediaUrl}
          alt="DIVINE:TIMING"
          fill
          className="object-cover"
          priority
          onError={() => setHasError(true)}
        />
      )}

      {/* Fallback Eclipse */}
      {useFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a0f1f] to-[#0f0c10]">
          {/* Eclipse placeholder - you can replace with actual image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full bg-gradient-radial from-[var(--accent)]/20 via-transparent to-transparent blur-3xl" />
          </div>
        </div>
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />

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
