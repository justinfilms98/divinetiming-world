'use client';

import { TRIBAL_SPIRAL_LENGTH, TRIBAL_SPIRAL_PATH } from '@/components/brand/tribalSpiralPath';
import { cn } from '@/lib/ui/cn';

type SpiralSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<SpiralSize, number> = {
  sm: 28,
  md: 48,
  lg: 72,
  xl: 112,
};

export interface SpiralLoaderProps {
  className?: string;
  size?: SpiralSize | number;
  /** draw = path fills from centre; spin = whole disc rotates; both = draw then keep spinning */
  variant?: 'draw' | 'spin' | 'both';
  label?: string;
  /** Show caption under the mark (route loading). */
  caption?: string;
}

/**
 * Brand loading / buffering indicator — the tribal spiral necklace mark in motion.
 * Respects prefers-reduced-motion (static mark + caption only).
 */
export function SpiralLoader({
  className,
  size = 'lg',
  variant = 'both',
  label = 'Loading',
  caption,
}: SpiralLoaderProps) {
  const px = typeof size === 'number' ? size : SIZE_PX[size];
  const motionClass =
    variant === 'draw'
      ? 'spiral-loader--draw'
      : variant === 'spin'
        ? 'spiral-loader--spin'
        : 'spiral-loader--both';

  return (
    <div
      className={cn('spiral-loader', motionClass, className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        className="spiral-loader__svg"
        aria-hidden
      >
        <circle cx="50" cy="50" r="40" className="spiral-loader__halo" />
        {/* Dim track so the unfilled path stays readable on night bands */}
        <path
          d={TRIBAL_SPIRAL_PATH}
          className="spiral-loader__track"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={TRIBAL_SPIRAL_LENGTH}
        />
        <path
          d={TRIBAL_SPIRAL_PATH}
          className="spiral-loader__path"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={TRIBAL_SPIRAL_LENGTH}
        />
      </svg>
      {caption ? <p className="spiral-loader__caption">{caption}</p> : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}
