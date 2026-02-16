'use client';

import { cn } from '@/lib/ui/cn';

interface SignatureDividerProps {
  className?: string;
}

/** Eclipse-style thin gradient line between sections. */
export function SignatureDivider({ className }: SignatureDividerProps) {
  return (
    <div
      className={cn(
        'h-px w-full max-w-2xl mx-auto my-12 md:my-16',
        'bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent',
        className
      )}
      aria-hidden
    />
  );
}
