import { notFound } from 'next/navigation';
import { ContentRail } from '@/components/layout/ContentRail';
import { isLabelPublicEnabled } from '@/lib/features';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Label',
  robots: { index: false, follow: false },
};

export default function LabelPage() {
  if (!isLabelPublicEnabled()) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full min-h-[50vh] bg-[var(--bg)]">
      <ContentRail className="py-24 md:py-32">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Label</p>
        <p className="mt-4 text-sm text-[var(--text-muted)] max-w-sm text-center leading-relaxed">
          Coming soon.
        </p>
      </ContentRail>
    </div>
  );
}
