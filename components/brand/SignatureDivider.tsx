'use client';

import { cn } from '@/lib/ui/cn';

interface SignatureDividerProps {
  className?: string;
}

/**
 * Phase 33: Site signature element — thin gradient line with soft center highlight.
 * Left fade → center highlight → right fade; very subtle glow. No animation.
 * Appears on Home, Booking, Media, Shop, EPK between major sections.
 */
export function SignatureDivider({ className }: SignatureDividerProps) {
  return (
    <div
      className={cn(
        'signature-divider-line max-w-2xl mx-auto my-12 md:my-16',
        className
      )}
      aria-hidden
    />
  );
}
