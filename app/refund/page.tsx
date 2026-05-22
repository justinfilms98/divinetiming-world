import { notFound } from 'next/navigation';
import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Returns and refunds for Divine Timing shop orders.',
  alternates: { canonical: '/refund' },
};

export default async function RefundPage() {
  const policy = await getLegalPolicy('refund');
  if (!policy) notFound();
  return <LegalPageView title={policy.title} bodyMd={policy.body_md} updatedAt={policy.updated_at} />;
}
