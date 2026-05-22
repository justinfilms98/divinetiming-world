'use client';

import { useState } from 'react';
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
                <img
                  src={thumb}
                  alt={v.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
          onClick={() => {
            setActive(null);
            setActiveUrl(null);
          }}
        >
          <video
            src={activeUrl}
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
