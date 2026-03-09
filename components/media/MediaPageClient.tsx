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
import { Grid } from '@/components/ui/Grid';
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

  const hasGalleries = galleries.length > 0;
  const hasVideos = videos.length > 0;
  const showEmptyCollections = activeTab === 'galleries' && !hasGalleries;
  const showEmptyVideos = activeTab === 'videos' && !hasVideos;

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 min-w-0">
      <GlassPanel className="w-full">
        {showHeadline && (
          <>
            <h1 className="type-h1 text-[var(--text)] mb-8 text-center tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {headline}
            </h1>
            {subtext && (
              <p className="type-body text-[var(--text-muted)] text-center mb-8 max-w-[65ch] mx-auto">{subtext}</p>
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

        {showEmptyCollections ? (
          <div className="py-20 text-center">
            <p className="text-[var(--text-muted)] text-lg tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>
              Media collections coming soon.
            </p>
          </div>
        ) : showEmptyVideos ? (
          <div className="py-20 text-center">
            <p className="text-[var(--text-muted)] text-lg tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>
              Videos coming soon.
            </p>
          </div>
        ) : activeTab === 'galleries' ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
              hidden: {},
            }}
          >
            <Grid cols={4}>
            {galleries.map((gallery) => {
              const coverUrl = gallery.resolved_cover_url ?? null;
              const hasMedia = gallery.media_count > 0;
              const hasSlug = Boolean(gallery.slug?.trim());
              const href = hasSlug ? `/media/galleries/${gallery.slug}` : null;

              const cardContent = (
                <>
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)] transition-[border-color,box-shadow,filter] duration-[var(--motion-standard)] ease-[var(--ease-standard)] hover:border-[var(--accent)]/45 hover:shadow-[var(--shadow-card-hover)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] card-atmosphere">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={gallery.name}
                        fill
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-[filter] duration-[200ms] ease-out group-hover:brightness-[1.05]"
                      />
                    ) : (
                      <MediaEmptyCard message="No cover" className="absolute inset-0 rounded-[var(--radius-card)]" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[200ms] pointer-events-none" aria-hidden />
                    {hasSlug && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms] pointer-events-none" aria-hidden>
                        <span className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] bg-black/20" aria-hidden>
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-[var(--text)] font-semibold type-h3 tracking-tight">{gallery.name}</h3>
                    {gallery.description && (
                      <p className="text-[var(--text-muted)] type-small mt-0.5 line-clamp-2">{gallery.description}</p>
                    )}
                    <p className="text-[var(--text-muted)] type-caption mt-1">
                      {gallery.media_count} {gallery.media_count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </>
              );

              return (
                <motion.div
                  key={gallery.id}
                  className="transition-transform duration-200 hover:-translate-y-0.5"
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 8 },
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  {href ? (
                    <Link
                      href={href}
                      className={`block group text-left cursor-pointer ${!hasMedia ? 'opacity-90' : ''}`}
                      onClick={() => track({ event_name: 'gallery_click', entity_type: 'gallery', entity_id: gallery.id })}
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <div className={`block group text-left ${!hasMedia ? 'opacity-90' : ''}`} aria-label={`${gallery.name} (no link)`}>
                      {cardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
            </Grid>
          </motion.div>
        ) : (
          <Grid cols={3}>
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
                  className={`group text-left rounded-xl overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)] transition-[border-color,box-shadow,filter] duration-[var(--motion-standard)] ease-[var(--ease-standard)] hover:border-[var(--accent)]/45 hover:shadow-[var(--shadow-card-hover)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] card-atmosphere aspect-video ${isTall ? 'md:aspect-[9/16]' : ''}`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={video.resolved_thumbnail_url}
                      alt={video.title}
                      fill
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-[filter] duration-[200ms] ease-out group-hover:brightness-[1.05]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[200ms]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] bg-black/20 group-hover:bg-black/30 transition-colors duration-[200ms]" aria-hidden>
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
          </Grid>
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
