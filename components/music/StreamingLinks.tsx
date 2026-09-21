import type { Release } from '@/lib/types/content';
import { cn } from '@/lib/ui/cn';

interface StreamingLinksProps {
  release: Release;
  className?: string;
}

const PLATFORMS: { key: keyof Release; label: string }[] = [
  { key: 'spotify_url', label: 'Spotify' },
  { key: 'apple_music_url', label: 'Apple Music' },
  { key: 'youtube_url', label: 'YouTube' },
  { key: 'soundcloud_url', label: 'SoundCloud' },
  { key: 'beatport_url', label: 'Beatport' },
];

/** Renders only the platforms an admin actually filled in. */
export function StreamingLinks({ release, className }: StreamingLinksProps) {
  const links = PLATFORMS.map((p) => ({
    label: p.label,
    href: (release[p.key] as string | null) ?? null,
  })).filter((l): l is { label: string; href: string } => Boolean(l.href));

  if (links.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-3', className)}>
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center rounded-[var(--radius-button)] border border-[var(--text)]/30 text-[var(--text)] type-button hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200 focus-ring"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
