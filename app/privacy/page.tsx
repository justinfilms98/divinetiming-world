import { notFound } from 'next/navigation';
import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Divine Timing handles your data.',
  alternates: { canonical: '/privacy' },
};

export default async function PrivacyPage() {
  const policy = await getLegalPolicy('privacy');
  if (!policy) notFound();
  return <LegalPageView title={policy.title} bodyMd={policy.body_md} updatedAt={policy.updated_at} />;
}
