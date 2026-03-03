'use client';

import { ImageIcon } from 'lucide-react';

/** Premium empty state for media (no "No Image" text). */
export function MediaEmptyCard({
  message = 'No cover',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-[var(--bg)] border border-[var(--accent)]/10 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ${className}`}
      aria-hidden
    >
      <ImageIcon className="w-10 h-10 text-[var(--text-muted)]/40" strokeWidth={1.2} />
      <span className="text-[var(--text-muted)]/50 text-sm tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>
        {message}
      </span>
    </div>
  );
}
