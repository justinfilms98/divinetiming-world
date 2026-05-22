import { notFound } from 'next/navigation';
import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of using the Divine Timing site and shop.',
  alternates: { canonical: '/terms' },
};

export default async function TermsPage() {
  const policy = await getLegalPolicy('terms');
  if (!policy) notFound();
  return <LegalPageView title={policy.title} bodyMd={policy.body_md} updatedAt={policy.updated_at} />;
}
