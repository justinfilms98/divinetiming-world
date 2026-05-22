'use client';

import { useState } from 'react';
import { Lightbox, type LightboxItem } from '@/components/media/Lightbox';
import { Play } from 'lucide-react';

export interface MasonryItem {
  id: string;
  url: string;
  mediaType: 'image' | 'video';
  caption?: string | null;
  posterUrl?: string | null;
}

interface MediaMasonryProps {
  items: MasonryItem[];
  /** Number of columns at lg breakpoint. Defaults to 4. */
  columns?: 3 | 4;
}

/** Pinterest-style masonry grid using CSS columns. Click any item to open lightbox. */
export function MediaMasonry({ items, columns = 4 }: MediaMasonryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const lightboxItems: LightboxItem[] = items.map((it) => ({
    url: it.url,
    mediaType: it.mediaType,
    caption: it.caption ?? null,
  }));

  const columnClass =
    columns === 3
      ? 'columns-1 sm:columns-2 lg:columns-3'
      : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4';

  return (
    <>
      <div className={`${columnClass} gap-4`}>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent)]/10 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {item.mediaType === 'video' ? (
              <div className="relative">
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.caption || ''}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.caption || ''}
                className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            )}
            {item.caption && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm truncate">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        items={lightboxItems}
        startIndex={openIndex ?? 0}
        open={openIndex != null}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
