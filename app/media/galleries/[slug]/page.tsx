import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import { getGalleryBySlug } from '@/lib/content/server';
import { GalleryDetailClient } from '@/components/media/GalleryDetailClient';
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
  return {
    title: gallery.name,
    description: gallery.description || `Photo gallery: ${gallery.name}`,
    openGraph: { title: `${gallery.name} | Divine Timing` },
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
      <Header />
      <main className="flex-1 py-16 px-4 min-w-0">
        <div className="max-w-6xl mx-auto">
          <GalleryDetailClient
            galleryName={gallery.name}
            galleryDescription={gallery.description}
            media={gridItems}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
