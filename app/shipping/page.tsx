import { notFound } from 'next/navigation';
import { getLegalPolicy } from '@/lib/content/server';
import { LegalPageView } from '@/components/legal/LegalPageView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'How shipping works for Divine Timing shop orders.',
  alternates: { canonical: '/shipping' },
};

export default async function ShippingPage() {
  const policy = await getLegalPolicy('shipping');
  if (!policy) notFound();
  return <LegalPageView title={policy.title} bodyMd={policy.body_md} updatedAt={policy.updated_at} />;
}
