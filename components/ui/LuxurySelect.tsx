'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/ui/cn';

interface LuxurySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
  inputClassName?: string;
}

const baseInput =
  'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[var(--text)] ' +
  'transition-all duration-200 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30 ' +
  'focus-visible:outline-none focus-visible:border-[var(--accent)]/50 focus-visible:ring-1 focus-visible:ring-[var(--accent)]/30 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-[length:1rem] bg-[right_0.75rem_center]';

export const LuxurySelect = forwardRef<HTMLSelectElement, LuxurySelectProps>(
  ({ label, error, options, className, inputClassName, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            baseInput,
            'pr-10',
            '[background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'rgba(255,255,255,0.5)\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")]',
            inputClassName
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[var(--bg)] text-[var(--text)]">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
LuxurySelect.displayName = 'LuxurySelect';
