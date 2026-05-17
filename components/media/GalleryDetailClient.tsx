'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { GalleryGrid } from '@/components/media/GalleryGrid';
import type { ViewerItem } from '@/components/media/ViewerModal';
import type { GalleryGridItem } from '@/components/media/GalleryGrid';
import { track } from '@/lib/analytics/track';

const ViewerModalLazy = lazy(() =>
  import('@/components/media/ViewerModal').then((m) => ({ default: m.ViewerModal }))
);

interface GalleryDetailClientProps {
  galleryName: string;
  galleryDescription?: string | null;
  media: GalleryGridItem[];
}

export function GalleryDetailClient({
  galleryName,
  galleryDescription,
  media,
}: GalleryDetailClientProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const items: ViewerItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.media_type,
    caption: m.caption,
  }));

  const handleItemClick = useCallback((index: number) => {
    const item = media[index];
    if (item) track({ event_name: 'viewer_open', entity_type: 'gallery_media', entity_id: item.id });
    setViewerIndex(index);
  }, [media]);

  const handleClose = useCallback(() => {
    setViewerIndex(null);
  }, []);

  return (
    <>
      <Link
        href="/media"
        className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded nav-link-underline relative"
      >
        ← Back to Media
      </Link>
      <header className="mb-12 md:mb-16">
        <h1 className="type-h1 text-[var(--text)] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          {galleryName}
        </h1>
        {galleryDescription ? (
          <p className="type-body text-[var(--text-muted)] prose-readability max-w-[60ch] leading-relaxed">
            {galleryDescription}
          </p>
        ) : (
          <p className="type-body text-[var(--text-muted)] max-w-[45ch]">Photos and media from this collection.</p>
        )}
      </header>
      {media.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[var(--text-muted)] text-lg tracking-wide type-body">
            No media in this collection yet.
          </p>
        </div>
      ) : (
        <GalleryGrid items={media} onItemClick={handleItemClick} className="mt-4 gap-6 md:gap-8" />
      )}

      {viewerIndex !== null && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          }
        >
          <ViewerModalLazy
            items={items}
            currentIndex={viewerIndex}
            onClose={handleClose}
            onIndexChange={setViewerIndex}
          />
        </Suspense>
      )}
    </>
  );
}
