'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics/track';
import { VideoGrid } from '@/components/media/VideoGrid';
import { StoryCard } from '@/components/collections/StoryCard';
import { EmptyState } from '@/components/ui/EmptyState';
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
    <div className="flex-1 w-full max-w-full min-w-0">
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
            className={`min-h-[44px] px-6 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
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
            className={`min-h-[44px] px-6 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
              activeTab === 'videos'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] border-b-2 border-transparent hover:text-[var(--text)]'
            }`}
          >
            Videos
          </button>
        </div>

        {showEmptyCollections ? (
          <EmptyState title="No collections yet" message="Photo stories will appear here once they're published." />
        ) : showEmptyVideos ? (
          <EmptyState title="No videos yet" message="Films and live sets will appear here once they're published." />
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
    <div>
      <motion.div
        className="space-y-14 md:space-y-16"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
          hidden: {},
        }}
      >
        {galleries.map((gallery, index) => {
          const hasSlug = Boolean(gallery.slug?.trim());
          return (
            <motion.div
              key={gallery.id}
              variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 12 } }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              onClick={() =>
                track({ event_name: 'gallery_click', entity_type: 'gallery', entity_id: gallery.id })
              }
            >
              {hasSlug ? (
                <StoryCard story={gallery} imageOnRight={index % 2 === 1} />
              ) : (
                <div className="opacity-90">
                  <h3 className="type-h2 text-[var(--text)]">{gallery.name}</h3>
                  {gallery.description && (
                    <p className="type-body text-[var(--text-muted)] mt-3 line-clamp-3">{gallery.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
      <p className="mt-12 text-center">
        <Link
          href="/collections"
          className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
        >
          All visual stories →
        </Link>
      </p>
    </div>
  );
}
