import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GalleryDetailClient } from '@/components/media/GalleryDetailClient';

export const dynamic = 'force-dynamic';

export default async function GalleryPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: gallery } = await supabase
    .from('galleries')
    .select('*, gallery_media(*)')
    .eq('slug', params.slug)
    .single();

  if (!gallery) {
    notFound();
  }

  const sortedMedia = (gallery.gallery_media || []).sort(
    (a: { display_order: number }, b: { display_order: number }) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  const gridItems = sortedMedia
    .filter((m: { url: string | null }) => m.url)
    .map((m: { id: string; media_type: string; url: string; thumbnail_url?: string | null; caption?: string | null }) => ({
      id: m.id,
      media_type: m.media_type as 'image' | 'video',
      url: m.url,
      thumbnail_url: m.thumbnail_url ?? null,
      caption: m.caption ?? null,
    }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 px-4">
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
