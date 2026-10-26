import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import { LegalPendingView } from '@/components/legal/LegalPendingView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getLegalPolicy('shipping');
  return {
    title: 'Shipping Policy',
    description: 'How shipping works for Divine Timing shop orders.',
    alternates: { canonical: '/shipping' },
    // Draft policies show a holding page that must not be indexed.
    ...(policy ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ShippingPage() {
  const policy = await getLegalPolicy('shipping');
  if (!policy) return <LegalPendingView title="Shipping Policy" />;
  return (
    <LegalPageView
      title={policy.title}
      bodyMd={policy.body_md}
      updatedAt={policy.updated_at}
      effectiveDate={policy.effective_date}
    />
  );
}
