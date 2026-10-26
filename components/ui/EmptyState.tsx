import Link from 'next/link';
import { SpiralMark } from '@/components/brand/SpiralMark';
import { cn } from '@/lib/ui/cn';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: { label: string; href: string };
  tone?: 'light' | 'dark';
  className?: string;
}

/** Compact, branded "nothing here yet" block for public list pages. Never invents content. */
export function EmptyState({ title, message, action, tone = 'light', className }: EmptyStateProps) {
  const dark = tone === 'dark';
  return (
    <div className={cn('flex flex-col items-center text-center py-10 md:py-14 px-4', className)}>
      <SpiralMark size={36} className={dark ? 'text-[var(--accent)]' : 'text-[var(--accent)]/80'} />
      <p
        className={cn('type-h3 mt-5 tracking-tight', dark ? 'text-[var(--text-on-dark)]' : 'text-[var(--text)]')}
      >
        {title}
      </p>
      {message && (
        <p
          className={cn(
            'type-body mt-2 max-w-[40ch] leading-relaxed',
            dark ? 'text-[var(--text-on-dark-muted)]' : 'text-[var(--text-muted)]'
          )}
        >
          {message}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] border border-[var(--accent)]/50 px-6 text-sm font-semibold tracking-wide text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors focus-ring"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
