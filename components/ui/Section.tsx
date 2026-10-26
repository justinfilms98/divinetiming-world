'use client';

import { cn } from '@/lib/ui/cn';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  /** Optional section title (e.g. H2). */
  title?: string;
  /** Optional subtitle below title. */
  subtitle?: string;
  /** Default vertical padding. Disable when the caller supplies its own (e.g. `page-body`). */
  padded?: boolean;
}

/**
 * Shared section wrapper: py-12 md:py-16, optional title/subtitle.
 * Maintains vertical rhythm between sections.
 */
export function Section({
  children,
  className,
  title,
  subtitle,
  padded = true,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cn(padded && 'py-12 md:py-16', className)}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="mb-8 md:mb-10">
          {title && (
            <h2 className="type-h2 font-semibold tracking-tight text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-[var(--text-muted)] type-body prose-readability">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
