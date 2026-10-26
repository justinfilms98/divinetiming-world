import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import { LegalPendingView } from '@/components/legal/LegalPendingView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getLegalPolicy('refund');
  return {
    title: 'Refund Policy',
    description: 'Returns and refunds for Divine Timing shop orders.',
    alternates: { canonical: '/refund' },
    // Draft policies show a holding page that must not be indexed.
    ...(policy ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function RefundPage() {
  const policy = await getLegalPolicy('refund');
  if (!policy) return <LegalPendingView title="Refund Policy" />;
  return (
    <LegalPageView
      title={policy.title}
      bodyMd={policy.body_md}
      updatedAt={policy.updated_at}
      effectiveDate={policy.effective_date}
    />
  );
}
