import { notFound } from 'next/navigation';
import { getGalleryBySlug } from '@/lib/content/server';
import { CollectionStory } from '@/components/collections/CollectionStory';
import { imageGalleryJsonLd } from '@/lib/seo/jsonld';
import { absoluteImageUrl, BASE_URL, SITE_NAME } from '@/lib/site';
import { collectionStoryHref } from '@/lib/content/shared';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return { title: 'Story' };

  const path = collectionStoryHref(gallery.slug);
  const description = gallery.description?.trim() || `${gallery.name} — a visual story by ${SITE_NAME}.`;
  const ogImageUrl = absoluteImageUrl(gallery.resolved_cover_url ?? null);

  return {
    title: gallery.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${gallery.name} | ${SITE_NAME}`,
      description,
      url: path,
      type: 'website',
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: gallery.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${gallery.name} | ${SITE_NAME}`,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function CollectionStoryPage({ params }: Params) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) notFound();

  const frames = gallery.gallery_media
    .filter((item) => item.resolved_url)
    .map((item) => ({
      id: item.id,
      media_type: item.media_type,
      url: item.resolved_url!,
      thumbnail_url: item.resolved_thumbnail_url ?? null,
      caption: item.caption ?? null,
    }));

  const images = frames
    .filter((frame) => frame.media_type === 'image')
    .map((frame) => absoluteImageUrl(frame.url))
    .filter((url): url is string => Boolean(url));

  const jsonLd = imageGalleryJsonLd({
    name: gallery.name,
    description: gallery.description?.trim() || undefined,
    url: `${BASE_URL}${collectionStoryHref(gallery.slug)}`,
    image: images,
  });

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionStory
        title={gallery.name}
        intro={gallery.description}
        theme={gallery.theme}
        coverUrl={gallery.resolved_cover_url ?? null}
        frames={frames}
      />
    </div>
  );
}
