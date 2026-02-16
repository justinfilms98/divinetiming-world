'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/ui/cn';

interface LuxuryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

const baseInput =
  'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[var(--text)] placeholder:text-white/40 ' +
  'transition-all duration-200 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30 ' +
  'focus-visible:outline-none focus-visible:border-[var(--accent)]/50 focus-visible:ring-1 focus-visible:ring-[var(--accent)]/30 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const LuxuryInput = forwardRef<HTMLInputElement, LuxuryInputProps>(
  ({ label, error, className, inputClassName, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInput, inputClassName)}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
LuxuryInput.displayName = 'LuxuryInput';
