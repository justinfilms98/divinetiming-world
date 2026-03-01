'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Max width class; default max-w-4xl for admin, can override for public */
  maxWidth?: string;
}

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  className,
  maxWidth = 'max-w-4xl',
}: PageShellProps) {
  return (
    <div className={cn('w-full', maxWidth, className)}>
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{title}</h1>
            {subtitle && <p className="text-white/60 text-sm md:text-base">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
