'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics/track';
import { MediaEmptyCard } from '@/components/media/MediaEmptyCard';
import { VideoGrid } from '@/components/media/VideoGrid';
import type { MediaPageVideo, GalleryForHub } from '@/lib/content/shared';

interface MediaPageClientProps {
  galleries: GalleryForHub[];
  videos: MediaPageVideo[];
  headline: string;
  subtext?: string | null;
  showHeadline?: boolean;
}

export function MediaPageClient({
  galleries,
  videos,
  headline,
  subtext,
  showHeadline = true,
}: MediaPageClientProps) {
  const [activeTab, setActiveTab] = useState<'galleries' | 'videos'>('galleries');

  const hasGalleries = galleries.length > 0;
  const hasVideos = videos.length > 0;
  const showEmptyCollections = activeTab === 'galleries' && !hasGalleries;
  const showEmptyVideos = activeTab === 'videos' && !hasVideos;

  return (
    <div className="flex-1 w-full max-w-full py-12 md:py-16 px-4 md:px-6 min-w-0">
      <div className="w-full max-w-7xl mx-auto">
        {showHeadline && (
          <>
            <h1
              className="type-h1 text-[var(--text)] mb-6 text-center tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {headline}
            </h1>
            {subtext && (
              <p className="type-body text-[var(--text-muted)] text-center mb-10 max-w-[65ch] mx-auto">
                {subtext}
              </p>
            )}
          </>
        )}

        <div className="flex justify-center gap-2 mb-10 md:mb-12">
          <button
            type="button"
            onClick={() => setActiveTab('galleries')}
            className={`px-6 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
              activeTab === 'galleries'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] border-b-2 border-transparent hover:text-[var(--text)]'
            }`}
          >
            Collections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
              activeTab === 'videos'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] border-b-2 border-transparent hover:text-[var(--text)]'
            }`}
          >
            Videos
          </button>
        </div>

        {showEmptyCollections ? (
          <div className="py-24 md:py-32 text-center">
            <p className="text-[var(--text-muted)] type-body leading-relaxed max-w-[40ch] mx-auto">
              Media collections coming soon.
            </p>
          </div>
        ) : showEmptyVideos ? (
          <div className="py-24 md:py-32 text-center">
            <p className="text-[var(--text-muted)] type-body leading-relaxed max-w-[40ch] mx-auto">
              Videos coming soon.
            </p>
          </div>
        ) : activeTab === 'galleries' ? (
          <CollectionsMasonry galleries={galleries} />
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </div>
  );
}

function CollectionsMasonry({ galleries }: { galleries: GalleryForHub[] }) {
  return (
    <motion.div
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-5"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0 } },
        hidden: {},
      }}
    >
      {galleries.map((gallery) => {
        const coverUrl = gallery.resolved_cover_url ?? null;
        const hasMedia = gallery.media_count > 0;
        const hasSlug = Boolean(gallery.slug?.trim());
        const href = hasSlug ? `/media/galleries/${gallery.slug}` : null;

        const inner = (
          <div className="relative w-full overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent)]/15 transition-all duration-500 group-hover:border-[var(--accent)]/40 group-hover:shadow-[var(--shadow-card-hover)]">
            <div className="relative w-full aspect-[4/5]">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={gallery.name}
                  fill
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <MediaEmptyCard message="No cover" className="absolute inset-0 rounded-[var(--radius-card)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <h3 className="text-white font-medium text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {gallery.name}
                </h3>
                <p className="text-white/70 text-xs uppercase tracking-[0.2em] mt-1">
                  {gallery.media_count} {gallery.media_count === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </div>
        );

        return (
          <motion.div
            key={gallery.id}
            className="mb-4 md:mb-5 break-inside-avoid"
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 12 } }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {href ? (
              <Link
                href={href}
                className={`block group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded-xl ${!hasMedia ? 'opacity-90' : ''}`}
                onClick={() =>
                  track({ event_name: 'gallery_click', entity_type: 'gallery', entity_id: gallery.id })
                }
              >
                {inner}
                <div className="mt-3 px-1">
                  <h3 className="text-[var(--text)] font-medium tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {gallery.name}
                  </h3>
                  {gallery.description && (
                    <p className="text-[var(--text-muted)] text-xs mt-0.5 line-clamp-2">{gallery.description}</p>
                  )}
                </div>
              </Link>
            ) : (
              <div className={`block group ${!hasMedia ? 'opacity-90' : ''}`}>
                {inner}
                <div className="mt-3 px-1">
                  <h3 className="text-[var(--text)] font-medium tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {gallery.name}
                  </h3>
                  {gallery.description && (
                    <p className="text-[var(--text-muted)] text-xs mt-0.5 line-clamp-2">{gallery.description}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
