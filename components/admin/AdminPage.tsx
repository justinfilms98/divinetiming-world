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

/** Standardized admin page layout: header (title, subtitle, actions) + content. */
export function AdminPage({
  title,
  subtitle,
  actions,
  children,
  className,
}: AdminPageProps) {
  return (
    <div className={cn('space-y-8', className)}>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-3xl font-semibold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-white/50 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex flex-wrap gap-2">{actions}</div>
        )}
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}
