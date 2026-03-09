'use client';

import { cn } from '@/lib/ui/cn';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  children: React.ReactNode;
  className?: string;
  /** Slightly stronger border on hover (e.g. for clickable cards). */
  hover?: boolean;
  /** Use on dark backgrounds (e.g. hero sections). */
  variant?: 'default' | 'dark';
  /** Render as a different element (e.g. "aside", "article"). */
  as?: React.ElementType;
}

/**
 * Shared card: rounded-xl, border, shadow.
 * Default variant uses design tokens (accent border) for light backgrounds.
 * Dark variant uses border-white/10 for use on dark sections.
 */
export function Card({ children, className, hover, variant = 'default', as: Component = 'div', ...rest }: CardProps) {
  return (
    <Component
      {...rest}
      className={cn(
        'rounded-xl overflow-hidden relative',
        variant === 'default' &&
          'border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)] card-atmosphere',
        variant === 'dark' &&
          'border border-white/10 bg-white/5 shadow-md',
        hover && variant === 'default' &&
          'transition-[border-color,box-shadow] duration-200 ease-out hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)]',
        hover && variant === 'dark' &&
          'transition-colors duration-200 hover:border-white/20 hover:bg-white/10',
        className
      )}
    >
      {children}
    </Component>
  );
}
