'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

/**
 * Charter: one canonical outer shell for all public pages.
 * Ensures same max-width rail (via Container inside) and consistent overflow/width.
 */
export function PublicPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip',
        className
      )}
    >
      {children}
    </div>
  );
}
