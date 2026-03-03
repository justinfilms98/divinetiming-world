'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Section header for admin cards: title, optional description, optional actions. */
export function AdminSectionHeader({
  title,
  description,
  actions,
  className,
}: AdminSectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0 flex flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}
