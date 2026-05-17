'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AdminFormRowProps {
  label: string;
  children: ReactNode;
  help?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
}

/** Form row: label above, control, optional help text below, inline error under field. */
export function AdminFormRow({
  label,
  children,
  help,
  error,
  htmlFor,
  className,
}: AdminFormRowProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs uppercase tracking-wider text-slate-600 opacity-70 font-medium"
      >
        {label}
      </label>
      <div>{children}</div>
      {help && !error && (
        <p className="text-xs text-slate-500 leading-relaxed">{help}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
