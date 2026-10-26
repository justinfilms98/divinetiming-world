import Link from 'next/link';
import { SpiralMark } from '@/components/brand/SpiralMark';

/** Shown while a legal policy is still a draft, so footer links never land on a bare 404. */
export function LegalPendingView({ title }: { title: string }) {
  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <div className="page-body">
        <article className="max-w-2xl mx-auto px-4 md:px-6 text-center flex flex-col items-center">
          <SpiralMark size={40} className="text-[var(--accent)]" />
          <h1 className="type-h1 text-[var(--text)] mt-6 tracking-tight">{title}</h1>
          <p className="type-body text-[var(--text-muted)] mt-4 max-w-[46ch] leading-relaxed">
            This policy is being finalised and will be published here shortly. If you have a question in the
            meantime, we&apos;re happy to help.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors focus-ring"
            >
              Contact us
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] border border-[var(--text)]/20 px-6 text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
            >
              Back to home
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
