'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AdminPageProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standardized admin page layout: header (title, subtitle, actions) + content.
 * On phones the shell's top bar already shows the page name, so the H1 is visually
 * hidden there (kept for screen readers) and spacing is tighter.
 */
export function AdminPage({ title, subtitle, actions, children, className }: AdminPageProps) {
  return (
    <div className={cn('space-y-5 md:space-y-8', className)}>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1
            className="sr-only md:not-sr-only text-3xl font-semibold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {subtitle && <p className="md:mt-1 text-sm text-white/50 leading-relaxed">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex flex-wrap gap-2 [&>*]:min-h-11 md:[&>*]:min-h-0">{actions}</div>
        )}
      </header>
      <div className="space-y-5 md:space-y-8">{children}</div>
    </div>
  );
}
