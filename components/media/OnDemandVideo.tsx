'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { cn } from '@/lib/ui/cn';
import { canOptimizeImage, isVideoUrl } from '@/lib/media/mediaUrls';

interface OnDemandVideoProps {
  src: string;
  /** Still shown until play. Ignored if it is itself a video file. */
  poster?: string | null;
  /** Accessible name, e.g. "Play video 03". */
  label: string;
  /** Classes for the frame (size, radius, border). The frame is relatively positioned. */
  className?: string;
  /** Poster sizes hint for the image optimizer. */
  posterSizes?: string;
  /** Visual style of the placeholder when there is no poster. */
  tone?: 'public' | 'admin';
  muted?: boolean;
  /** Fill a positioned parent (absolute inset-0) instead of sizing itself at 16:9. */
  fill?: boolean;
}

/**
 * Video that downloads nothing until it is played: a poster (or a neutral panel) with a play
 * button. Pressing play swaps in the real <video> with controls and starts it.
 */
export function OnDemandVideo({
  src,
  poster,
  label,
  className,
  posterSizes = '(max-width: 768px) 100vw, 800px',
  tone = 'public',
  muted = false,
  fill = false,
}: OnDemandVideoProps) {
  const [playing, setPlaying] = useState(false);
  const still = poster && !isVideoUrl(poster) ? poster : null;

  if (playing) {
    return (
      <video
        src={src}
        poster={still ?? undefined}
        controls
        autoPlay
        playsInline
        muted={muted}
        preload="auto"
        className={cn(fill ? 'absolute inset-0 w-full h-full object-cover' : 'block w-full', 'bg-black', className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={label}
      className={cn(
        'group overflow-hidden focus-ring',
        fill ? 'absolute inset-0 w-full h-full' : 'relative block w-full aspect-video',
        tone === 'public' ? 'bg-gradient-to-br from-white/[0.06] to-black' : 'bg-black/50',
        className
      )}
    >
      {still &&
        (canOptimizeImage(still) ? (
          <Image src={still} alt="" fill sizes={posterSizes} quality={75} className="object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- poster from a host the optimizer can't fetch
          <img src={still} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ))}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/40 transition-transform group-hover:scale-105">
          <Play className="h-6 w-6 translate-x-0.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}
