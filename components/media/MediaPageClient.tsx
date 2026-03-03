'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics/track';
import { MediaEmptyCard } from '@/components/media/MediaEmptyCard';
import { VideoPlayerModal } from '@/components/media/VideoPlayerModal';
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
  const [videoModal, setVideoModal] = useState<MediaPageVideo | null>(null);

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 min-w-0">
      <GlassPanel className="max-w-6xl w-full">
        {showHeadline && (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-8 text-center tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {headline}
            </h1>
            {subtext && (
              <p className="text-[var(--text-muted)] text-center mb-8">{subtext}</p>
            )}
          </>
        )}

        {/* Tabs: Collections (default), Videos */}
        <div className={`flex justify-center gap-4 mb-8 ${!showHeadline ? 'mt-0' : ''}`}>
          <button
            type="button"
            onClick={() => setActiveTab('galleries')}
            className={`px-6 py-2.5 rounded-[var(--radius-button)] transition-colors duration-200 font-medium type-button ${
              activeTab === 'galleries'
                ? 'bg-[var(--accent)] text-[var(--text)]'
                : 'bg-[var(--bg-secondary)]/80 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Collections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2.5 rounded-[var(--radius-button)] transition-colors duration-200 font-medium type-button ${
              activeTab === 'videos'
                ? 'bg-[var(--accent)] text-[var(--text)]'
                : 'bg-[var(--bg-secondary)]/80 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Videos
          </button>
        </div>

        {activeTab === 'galleries' ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06 } },
              hidden: {},
            }}
          >
            {galleries.map((gallery) => {
              const coverUrl = gallery.resolved_cover_url ?? null;
              const hasMedia = gallery.media_count > 0;
              const href = hasMedia ? `/media/galleries/${gallery.slug}` : '#';

              return (
                <motion.div
                  key={gallery.id}
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 16 },
                  }}
                >
                  <Link
                    href={href}
                    className={`block group text-left ${!hasMedia ? 'pointer-events-none cursor-default' : ''}`}
                    onClick={() => hasMedia && track({ event_name: 'gallery_click', entity_type: 'gallery', entity_id: gallery.id })}
                  >
                    <div className="relative aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)] transition-all duration-[250ms] ease-out hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={gallery.name}
                          fill
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition-transform duration-[250ms] group-hover:scale-[1.03]"
                        />
                      ) : (
                        <MediaEmptyCard message="No cover" className="absolute inset-0 rounded-[var(--radius-card)]" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[250ms]" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms] pointer-events-none">
                        <span className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] bg-black/20" aria-hidden>
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[var(--text)] font-semibold type-h3">{gallery.name}</div>
                      {gallery.description && (
                        <div className="text-[var(--text-muted)] text-sm mt-0.5 line-clamp-2">{gallery.description}</div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => {
              const isTall = index % 3 === 1;
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    track({ event_name: 'video_click', entity_type: 'video', entity_id: video.id });
                    setVideoModal(video);
                  }}
                  className={`group text-left rounded-[var(--radius-card)] overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.02] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] aspect-video ${isTall ? 'md:aspect-[9/16]' : ''}`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={video.resolved_thumbnail_url}
                      alt={video.title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[250ms] group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[250ms]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] bg-black/20 group-hover:bg-black/30 transition-colors duration-[250ms]" aria-hidden>
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[var(--text)] font-semibold type-small truncate">{video.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </GlassPanel>

      <VideoPlayerModal
        youtubeId={videoModal?.youtube_id ?? ''}
        title={videoModal?.title ?? ''}
        open={!!videoModal}
        onClose={() => setVideoModal(null)}
      />
    </div>
  );
}
