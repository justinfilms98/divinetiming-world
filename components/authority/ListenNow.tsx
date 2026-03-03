'use client';

import type { FeaturedEmbed } from '@/lib/authority-config';
import { getPlatformLinks } from '@/lib/platformLinks';
import type { PlatformLinkOverrides } from '@/lib/platformLinks';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/ui/cn';

interface ListenNowProps {
  /** Optional overrides (e.g. siteSettings) for platform URLs. */
  platformOverrides?: PlatformLinkOverrides | null;
  featuredEmbed?: FeaturedEmbed | null;
  className?: string;
}

/**
 * Direct Listen actions from platformLinks (Spotify, Apple Music, YouTube, etc.).
 * No embed tab — all actions go to external URLs.
 */
export function ListenNow({ platformOverrides, featuredEmbed, className }: ListenNowProps) {
  const platformLinks = getPlatformLinks(platformOverrides ?? undefined);
  const primary = platformLinks.filter((l) => ['spotify', 'appleMusic'].includes(l.id));
  const secondary = platformLinks.filter((l) => ['youtube'].includes(l.id));
  const hasLinks = primary.length > 0 || secondary.length > 0;
  if (!hasLinks && !featuredEmbed) return null;

  return (
    <Reveal className={cn('px-4', className)}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm uppercase tracking-widest text-white/60 mb-6">Listen now</p>
        <div className="flex flex-wrap justify-center gap-4">
          {primary.map((l) => (
            <a
              key={l.id}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-[var(--accent)]/90 text-[var(--text)] hover:bg-[var(--accent)] border border-[var(--accent)] font-medium transition-colors duration-250 ease-out text-sm"
            >
              {l.label}
            </a>
          ))}
          {secondary.map((l) => (
            <a
              key={l.id}
              href={l.href}
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
