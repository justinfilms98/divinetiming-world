import { notFound } from 'next/navigation';
import { getGalleryBySlug } from '@/lib/content/server';
import { GalleryDetailClient } from '@/components/media/GalleryDetailClient';
import { Container } from '@/components/ui/Container';
import { absoluteImageUrl } from '@/lib/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return { title: 'Gallery' };
  const path = `/media/galleries/${slug}`;
  const description = gallery.description || `Photo gallery: ${gallery.name}`;
  const ogImageUrl = absoluteImageUrl(gallery.resolved_cover_url ?? null);
  return {
    title: `${gallery.name} | Divine Timing Media`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${gallery.name} | Divine Timing Media`,
      description,
      url: path,
      type: 'website',
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: gallery.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${gallery.name} | Divine Timing Media`,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    notFound();
  }

  const gridItems = gallery.gallery_media
    .filter((m) => m.resolved_url)
    .map((m) => ({
      id: m.id,
      media_type: m.media_type,
      url: m.resolved_url!,
      thumbnail_url: m.resolved_thumbnail_url ?? null,
      caption: m.caption ?? null,
    }));

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <main className="flex-1 pt-24 md:pt-28 pb-16 min-w-0">
        <Container>
          <div className="max-w-[1000px] mx-auto w-full">
            <GalleryDetailClient
              galleryName={gallery.name}
              galleryDescription={gallery.description}
              media={gridItems}
            />
          </div>
        </Container>
      </main>
    </div>
  );
}
