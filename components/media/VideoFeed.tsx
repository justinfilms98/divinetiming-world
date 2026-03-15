'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MediaPageVideo } from '@/lib/content/shared';

/** Safe embed URL: 11-char ID only. No autoplay to avoid multi-video clutter. */
function embedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?modestbranding=1&rel=0`;
}

const SWIPE_THRESHOLD_PX = 50;

interface VideoFeedProps {
  videos: MediaPageVideo[];
}

/**
 * Vertical short-form video experience.
 * Desktop: centered 9:16 player with prev/next; balanced layout.
 * Mobile: one focal video; swipe left/right to change; prev/next buttons.
 * Only the active video is rendered (single iframe) to avoid layout jumps and clutter.
 */
export function VideoFeed({ videos }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = videos[currentIndex] ?? null;
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? videos.length - 1 : i - 1));
  }, [videos.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i >= videos.length - 1 ? 0 : i + 1));
  }, [videos.length]);

  useEffect(() => {
    if (currentIndex >= videos.length && videos.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, videos.length]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start == null || videos.length <= 1) return;
      const end = e.changedTouches[0]?.clientX ?? start;
      const delta = end - start;
      if (delta < -SWIPE_THRESHOLD_PX) goNext();
      else if (delta > SWIPE_THRESHOLD_PX) goPrev();
    },
    [videos.length, goNext, goPrev]
  );

  if (videos.length === 0) return null;

  return (
    <div
      className="flex flex-col items-center w-full max-w-[min(380px,92vw)] mx-auto py-6 md:py-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Single focal area: one 9:16 player, no layout jump */}
      <div
        className="relative w-full aspect-[9/16] max-h-[78vh] rounded-2xl overflow-hidden bg-black border border-[var(--accent)]/15 shadow-[var(--shadow-card-hover)] ring-1 ring-[var(--text)]/5"
        style={{ contain: 'layout' }}
      >
        {current && (
          <iframe
            key={current.id}
            src={embedUrl(current.youtube_id)}
            title={current.title}
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>

      {/* Title + caption: clear hierarchy */}
      {current && (
        <div className="mt-6 md:mt-8 w-full text-center min-w-0 px-2">
          <h3 className="type-h3 text-[var(--text)] font-medium tracking-tight line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
            {current.title}
          </h3>
          {current.caption && (
            <p className="mt-2 text-[var(--text-muted)] type-small leading-relaxed line-clamp-3 max-w-[90%] mx-auto">
              {current.caption}
            </p>
          )}
        </div>
      )}

      {/* Prev / Next: clear controls */}
      {videos.length > 1 && (
        <div className="flex items-center justify-center gap-6 md:gap-8 mt-8 md:mt-10" aria-label="Video navigation">
          <button
            type="button"
            onClick={goPrev}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            aria-label="Previous video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[var(--text-muted)] type-small tabular-nums min-w-[4ch]" aria-live="polite">
            {currentIndex + 1} / {videos.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            aria-label="Next video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
