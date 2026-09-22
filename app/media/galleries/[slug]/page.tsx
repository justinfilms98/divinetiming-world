import { notFound, permanentRedirect } from 'next/navigation';
import { getGalleryBySlug } from '@/lib/content/server';
import { collectionStoryHref } from '@/lib/content/shared';

export const dynamic = 'force-dynamic';

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) notFound();
  permanentRedirect(collectionStoryHref(gallery.slug));
}
