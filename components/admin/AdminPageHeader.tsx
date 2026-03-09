'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Standard admin page header: title, optional description, right-side actions (e.g. Save). */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight admin-page-title">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed admin-page-desc">
            {description}
          </p>
        )}
      </div>
      {actions != null && (
        <div className="flex-shrink-0 flex flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}
