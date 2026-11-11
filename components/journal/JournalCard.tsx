import Link from 'next/link';
import Image from 'next/image';
import { NotebookPen } from 'lucide-react';
import { episodeLabel, upcomingDateLabel } from '@/lib/journal/rules';
import type { PublicJournalEpisode } from '@/lib/journal/types';

function publishedLabel(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Episode card for /journal and the homepage. Coming-soon cards say so instead of a date. */
export function JournalCard({ episode, eager = false }: { episode: PublicJournalEpisode; eager?: boolean }) {
  const label = episodeLabel(episode);
  const comingSoon = episode.status === 'coming_soon';
  const when = comingSoon
    ? episode.release_note || upcomingDateLabel(episode.scheduled_for) || 'Coming soon'
    : publishedLabel(episode.published_at);

  return (
    <Link href={`/journal/${episode.slug}`} className="group flex h-full flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-subtle)] bg-white/[0.03] focus-ring">
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {episode.cover_image_url ? (
          <Image
            src={episode.cover_image_url}
            alt={episode.cover_alt || ''}
            fill
            {...(eager ? { priority: true } : { loading: 'lazy' as const })}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <NotebookPen className="h-10 w-10 text-[var(--accent)]/40" />
          </div>
        )}
        {comingSoon && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {label && <p className="section-label mb-2">{label}</p>}
        <h3 className="type-h3 text-[var(--text)] line-clamp-2">{episode.title}</h3>
        {episode.summary && <p className="type-small mt-2 line-clamp-3">{episode.summary}</p>}
        {when && <p className="mt-auto pt-4 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{when}</p>}
      </div>
    </Link>
  );
}
