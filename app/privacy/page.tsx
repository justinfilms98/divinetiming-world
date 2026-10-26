import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import { LegalPendingView } from '@/components/legal/LegalPendingView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getLegalPolicy('privacy');
  return {
    title: 'Privacy Policy',
    description: 'How Divine Timing handles your data.',
    alternates: { canonical: '/privacy' },
    // Draft policies show a holding page that must not be indexed.
    ...(policy ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function PrivacyPage() {
  const policy = await getLegalPolicy('privacy');
  if (!policy) return <LegalPendingView title="Privacy Policy" />;
  return (
    <LegalPageView
      title={policy.title}
      bodyMd={policy.body_md}
      updatedAt={policy.updated_at}
      effectiveDate={policy.effective_date}
    />
  );
}
