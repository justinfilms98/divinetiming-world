'use client';

import Link from 'next/link';
import { getPlatformLinks } from '@/lib/platformLinks';
import { cn } from '@/lib/ui/cn';
import type { SiteSettings } from '@/lib/types/content';

interface AuthorityCTAsProps {
  showBook?: boolean;
  showListen?: boolean;
  showEPK?: boolean;
  siteSettings?: SiteSettings | null;
  className?: string;
}

/** Listen = direct links from platformLinks (Spotify, Apple Music, etc.). */
export function AuthorityCTAs({
  showBook = true,
  showListen = true,
  showEPK = true,
  siteSettings,
  className,
}: AuthorityCTAsProps) {
  const platformLinks = getPlatformLinks(siteSettings ?? undefined);
  const listenLinks = platformLinks.filter((l) =>
    ['spotify', 'appleMusic', 'youtube'].includes(l.id)
  );

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
          className="px-6 py-3 min-h-[44px] rounded-[var(--radius-button)] font-semibold type-button bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] transition-colors duration-250 ease-out glow focus-ring"
        >
          Book
        </Link>
      )}
      {showListen &&
        listenLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 min-h-[44px] rounded-[var(--radius-button)] border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-colors duration-250 ease-out type-button focus-ring"
          >
            {link.label}
          </a>
        ))}
      {showEPK && (
        <Link
          href="/presskit"
          className="px-6 py-3 min-h-[44px] text-white/80 hover:text-white transition-colors duration-250 ease-out text-sm font-medium type-button focus-ring"
        >
          Press Kit
        </Link>
      )}
    </div>
  );
}
