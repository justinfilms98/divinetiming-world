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
        className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors mb-8"
      >
        ← Back to Media
      </Link>
      <h1 className="text-4xl font-bold text-white mb-4">{galleryName}</h1>
      {galleryDescription && (
        <p className="text-white/70 mb-12">{galleryDescription}</p>
      )}
      <GalleryGrid items={media} onItemClick={handleItemClick} />

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
