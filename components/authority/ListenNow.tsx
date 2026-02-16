'use client';

import type { StreamingLinks, FeaturedEmbed } from '@/lib/authority-config';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/ui/cn';

interface ListenNowProps {
  streamingLinks?: StreamingLinks | null;
  featuredEmbed?: FeaturedEmbed | null;
  className?: string;
}

/**
 * Direct Listen actions: Apple Music and Spotify as primary buttons.
 * Optional YouTube link. No embed tab — all actions go to external URLs.
 */
export function ListenNow({ streamingLinks, featuredEmbed, className }: ListenNowProps) {
  const hasLinks = streamingLinks && Object.values(streamingLinks).some(Boolean);
  if (!hasLinks && !featuredEmbed) return null;

  // Primary: Apple Music + Spotify (direct links). Secondary: YouTube, Bandcamp.
  const primary = [
    { label: 'Apple Music', url: streamingLinks?.apple_music },
    { label: 'Spotify', url: streamingLinks?.spotify },
  ].filter((l) => l.url);
  const secondary = [
    { label: 'YouTube', url: streamingLinks?.youtube },
    { label: 'Bandcamp', url: streamingLinks?.bandcamp },
  ].filter((l) => l.url);

  return (
    <Reveal className={cn('px-4', className)}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm uppercase tracking-widest text-white/60 mb-6">Listen now</p>
        <div className="flex flex-wrap justify-center gap-4">
          {primary.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-[var(--accent)]/90 text-[var(--bg)] hover:bg-[var(--accent)] border border-[var(--accent)] font-medium transition-colors duration-250 ease-out text-sm"
            >
              {l.label}
            </a>
          ))}
          {secondary.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-white/20 text-white/90 hover:bg-white/10 hover:border-[var(--accent)]/50 transition-colors duration-250 ease-out text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
