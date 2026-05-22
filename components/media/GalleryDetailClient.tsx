'use client';

import Link from 'next/link';
import { MediaMasonry, type MasonryItem } from '@/components/media/MediaMasonry';
import type { GalleryGridItem } from '@/components/media/GalleryGrid';

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
  const items: MasonryItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    mediaType: m.media_type,
    caption: m.caption ?? null,
    posterUrl: m.thumbnail_url ?? null,
  }));

  return (
    <>
      <Link
        href="/media"
        className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded nav-link-underline relative"
      >
        ← Back to Media
      </Link>
      <header className="mb-12 md:mb-16">
        <h1
          className="type-h1 text-[var(--text)] mb-4 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {galleryName}
        </h1>
        {galleryDescription ? (
          <p className="type-body text-[var(--text-muted)] prose-readability max-w-[60ch] leading-relaxed">
            {galleryDescription}
          </p>
        ) : (
          <p className="type-body text-[var(--text-muted)] max-w-[45ch]">
            Photos and media from this collection.
          </p>
        )}
      </header>
      {media.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[var(--text-muted)] text-lg tracking-wide type-body">
            No media in this collection yet.
          </p>
        </div>
      ) : (
        <MediaMasonry items={items} columns={4} />
      )}
    </>
  );
}
