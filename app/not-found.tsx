import Link from 'next/link';
import type { Metadata } from 'next';
import { SpiralMark } from '@/components/brand/SpiralMark';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <div className="page-body">
        <div className="max-w-xl mx-auto px-4 md:px-6 text-center flex flex-col items-center">
          <SpiralMark size={44} className="text-[var(--accent)]" />
          <p className="section-label mt-6">404</p>
          <h1 className="type-h1 text-[var(--text)] mt-2 tracking-tight">This page drifted off</h1>
          <p className="type-body text-[var(--text-muted)] mt-4 max-w-[40ch] leading-relaxed">
            The link may be old, or the page may not be published yet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors focus-ring"
            >
              Back to home
            </Link>
            <Link
              href="/music"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] border border-[var(--text)]/20 px-6 text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
            >
              Listen to the music
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
