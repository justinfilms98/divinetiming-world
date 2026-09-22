'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { VideoPlayerModal } from '@/components/media/VideoPlayerModal';
import type { MediaPageVideo } from '@/lib/content/shared';

interface VideoGridProps {
  videos: MediaPageVideo[];
}

function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** 3-column grid of video thumbnails; clicking opens a modal (YouTube or library video). */
export function VideoGrid({ videos }: VideoGridProps) {
  const [active, setActive] = useState<MediaPageVideo | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full max-w-7xl mx-auto">
        {videos.map((v) => {
          const thumb = v.thumbnail_url || (v.youtube_id ? youtubeThumb(v.youtube_id) : null);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                if (v.youtube_id) {
                  setActive(v);
                  setActiveUrl(null);
                } else if (v.video_url) {
                  setActiveUrl(v.video_url);
                  setActive(v);
                }
              }}
              className="group relative block w-full aspect-video overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent)]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt={v.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg)]" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                <p className="text-white text-sm font-medium line-clamp-2 text-left" style={{ fontFamily: 'var(--font-display)' }}>
                  {v.title}
                </p>
                {v.caption && (
                  <p className="text-white/70 text-xs mt-1 line-clamp-1 text-left">{v.caption}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* YouTube modal */}
      <VideoPlayerModal
        youtubeId={active?.youtube_id ?? ''}
        title={active?.title ?? ''}
        open={!!active?.youtube_id && activeUrl == null}
        onClose={() => {
          setActive(null);
          setActiveUrl(null);
        }}
      />

      {/* Library video modal (HTML5) */}
      {activeUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active?.title || 'Video player'}
          onClick={() => {
            setActive(null);
            setActiveUrl(null);
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActive(null);
              setActiveUrl(null);
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <video
            src={activeUrl}
            title={active?.title}
            poster={active?.thumbnail_url || (active?.youtube_id ? youtubeThumb(active.youtube_id) : undefined) || undefined}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
