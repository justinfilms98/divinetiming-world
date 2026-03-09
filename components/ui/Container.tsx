'use client';

import { cn } from '@/lib/ui/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** If true, removes horizontal padding (e.g. when a child has its own padding). */
  noPadding?: boolean;
}

/**
 * Global container standard: max-w-[1200px], mx-auto, px-5 md:px-8.
 * Use across Events, Media, Booking, Shop, About for consistent width and rhythm.
 */
export function Container({ children, className, noPadding }: ContainerProps) {
  return (
    <div
      className={cn(
        'max-w-[1200px] mx-auto min-w-0',
        noPadding ? '' : 'px-5 md:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
