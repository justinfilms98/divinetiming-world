'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { playerUrlFor, watchUrlFor } from '@/lib/journal/rules';
import type { JournalVideoProvider } from '@/lib/journal/types';

/**
 * Cover with a play button. Nothing from YouTube or Vimeo loads until the visitor presses play,
 * so opening an episode costs only its cover image.
 */
export function JournalPlayer({
  provider,
  videoId,
  title,
  coverUrl,
  vertical,
}: {
  provider: JournalVideoProvider;
  videoId: string;
  title: string;
  coverUrl: string | null;
  vertical: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const host = provider === 'youtube' ? 'YouTube' : 'Vimeo';
  const frame = vertical ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-video';

  return (
    <div>
      <div className={`relative ${frame} rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-on-dark)] bg-black`}>
        {playing ? (
          <iframe
            src={playerUrlFor(provider, videoId)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 w-full focus-ring" aria-label={`Play ${title}`}>
            {coverUrl && (
              <Image src={coverUrl} alt="" fill priority sizes="(max-width: 768px) 100vw, 900px" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" aria-hidden />
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/50 bg-black/45 backdrop-blur-sm transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:bg-black/65">
                <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px] fill-white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <a
        href={watchUrlFor(provider, videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus-ring rounded"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Watch on {host}
      </a>
    </div>
  );
}
