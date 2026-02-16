'use client';

import { cn } from '@/lib/ui/cn';

interface LuxurySkeletonProps {
  className?: string;
}

/** Subtle shimmer-free skeleton; calm, no bright gradients. */
export function LuxurySkeleton({ className }: LuxurySkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white/10 border border-white/10 animate-pulse',
        className
      )}
      aria-hidden
    />
  );
}

/** Row of skeleton cards for grids */
export function LuxurySkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <LuxurySkeleton className="aspect-square w-full" />
          <LuxurySkeleton className="h-5 w-3/4" />
          <LuxurySkeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
