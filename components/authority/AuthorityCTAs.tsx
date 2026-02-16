'use client';

import Link from 'next/link';
import { getAuthorityConfig } from '@/lib/authority-config';
import { cn } from '@/lib/ui/cn';

interface AuthorityCTAsProps {
  showBook?: boolean;
  showListen?: boolean;
  showEPK?: boolean;
  className?: string;
}

/** Listen = direct links to Apple Music + Spotify only (no scroll/embed). */
export function AuthorityCTAs({
  showBook = true,
  showListen = true,
  showEPK = true,
  className,
}: AuthorityCTAsProps) {
  const { streamingLinks } = getAuthorityConfig(null);
  const appleMusic = streamingLinks?.apple_music;
  const spotify = streamingLinks?.spotify;

  return (
    <div
      className={cn(
        'flex flex-wrap justify-center items-center gap-4',
        className
      )}
    >
      {showBook && (
        <Link
          href="/booking"
          className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold hover:bg-[var(--accent2)] transition-colors duration-250 ease-out shadow-[0_0_20px_rgba(209,98,23,0.2)]"
        >
          Book
        </Link>
      )}
      {showListen && appleMusic && (
        <a
          href={appleMusic}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-colors duration-250 ease-out"
        >
          Apple Music
        </a>
      )}
      {showListen && spotify && (
        <a
          href={spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-colors duration-250 ease-out"
        >
          Spotify
        </a>
      )}
      {showEPK && (
        <Link
          href="/epk"
          className="px-6 py-3 text-white/80 hover:text-white transition-colors duration-250 ease-out text-sm font-medium"
        >
          View EPK
        </Link>
      )}
    </div>
  );
}
