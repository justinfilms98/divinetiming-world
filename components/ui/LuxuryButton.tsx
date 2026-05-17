'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/ui/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface LuxuryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--text)] border border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] focus-visible:ring-[var(--accent)] btn-primary-glow',
  secondary:
    'bg-transparent text-[var(--text)] border-2 border-[var(--accent)]/60 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] focus-visible:ring-[var(--accent)]',
  ghost:
    'bg-transparent text-[var(--text)] border border-white/20 hover:bg-white/10 hover:border-white/30 focus-visible:ring-white/40',
  subtle:
    'bg-white/10 text-[var(--text)] border border-white/10 hover:bg-white/15 hover:border-white/20 focus-visible:ring-white/30',
  danger:
    'bg-red-900/40 text-red-200 border border-red-500/40 hover:bg-red-900/60 hover:border-red-500/60 focus-visible:ring-red-500/50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-button-sm)] min-h-[36px]',
  md: 'px-5 py-2.5 text-[var(--text-button)] rounded-[var(--radius-button)] min-h-[44px]',
  lg: 'px-6 py-3 text-lg rounded-[var(--radius-button)] min-h-[52px]',
};

export const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-[color,background-color,border-color,box-shadow,transform,filter] duration-[200ms] ease-out type-button active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'disabled:opacity-50 disabled:pointer-events-none',
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);
LuxuryButton.displayName = 'LuxuryButton';
