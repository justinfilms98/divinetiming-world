import Link from 'next/link';
import { cn } from '@/lib/ui/cn';

interface SectionCtaProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const base =
  'min-h-[48px] px-7 py-3 inline-flex items-center justify-center rounded-[var(--radius-button)] type-button font-medium transition-all duration-200 btn-lift focus-ring';

/**
 * Section-level CTA. Both variants resolve against `--accent` and `--text`,
 * which `.band-night` remaps, so one component covers sand and dark bands.
 */
export function SectionCta({ href, children, variant = 'primary', className }: SectionCtaProps) {
  const style =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[#0B0B0C] hover:bg-[var(--accent-hover)] glow'
      : 'border border-[var(--text)]/30 text-[var(--text)] hover:border-[var(--text)]/60 hover:bg-[var(--text)]/5';

  const isExternal = href.startsWith('http');
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, style, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(base, style, className)}>
      {children}
    </Link>
  );
}
