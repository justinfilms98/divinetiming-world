import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import { LegalPendingView } from '@/components/legal/LegalPendingView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getLegalPolicy('terms');
  return {
    title: 'Terms of Service',
    description: 'Terms of using the Divine Timing site and shop.',
    alternates: { canonical: '/terms' },
    // Draft policies show a holding page that must not be indexed.
    ...(policy ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function TermsPage() {
  const policy = await getLegalPolicy('terms');
  if (!policy) return <LegalPendingView title="Terms of Service" />;
  return (
    <LegalPageView
      title={policy.title}
      bodyMd={policy.body_md}
      updatedAt={policy.updated_at}
      effectiveDate={policy.effective_date}
    />
  );
}
