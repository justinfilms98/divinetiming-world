import Link from 'next/link';
import type { Event } from '@/lib/types/content';
import { eventDetailHref } from '@/lib/eventDetailHref';
import { eventPlace, eventProofLinks, eventTypeLabel } from '@/lib/events/display';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';
import { Reveal } from '@/components/motion/Reveal';

interface PastEventsListProps {
  events: Event[];
}

function formatDayMonth(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByYear(events: Event[]): { year: number; events: Event[] }[] {
  const groups = new Map<number, Event[]>();
  for (const event of events) {
    const year = new Date(event.date).getFullYear();
    const bucket = groups.get(year);
    if (bucket) bucket.push(event);
    else groups.set(year, [event]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearEvents]) => ({ year, events: yearEvents }));
}

/**
 * Past dates rendered as a dense, year-grouped tour résumé rather than as a
 * second grid of hero cards. A booker scanning for "have they played rooms like
 * mine?" wants density; twenty large cards of finished shows reads as clutter.
 */
export function PastEventsList({ events }: PastEventsListProps) {
  const years = groupByYear(events);

  return (
    <div className="mt-12 space-y-12">
      {years.map(({ year, events: yearEvents }) => (
        <Reveal key={year}>
          <section aria-labelledby={`tour-year-${year}`}>
            <h3
              id={`tour-year-${year}`}
              className="type-h3 text-[var(--text)] pb-3 border-b border-[var(--border-subtle)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {year}
            </h3>

            <ul className="divide-y divide-[var(--border-subtle)]">
              {yearEvents.map((event) => {
                const href = eventDetailHref(event);
                const title = event.title ?? event.city;
                const place = eventPlace(event);
                const typeLabel = eventTypeLabel(event.event_type);
                const proofLinks = eventProofLinks(event);
                const thumbnail = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;

                return (
                  <li key={event.id} className="py-4 flex items-center gap-4 md:gap-5">
                    {thumbnail && (
                      <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                        <MediaAssetRenderer
                          url={thumbnail}
                          mediaType="image"
                          alt={`${title} — ${place || event.venue}`}
                          sizes="64px"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="type-small text-[var(--accent)] tabular-nums tracking-wide">
                        {formatDayMonth(event.date)}
                      </p>
                      <h4 className="type-body text-[var(--text)] font-medium truncate">
                        <Link href={href} className="hover:text-[var(--accent)] transition-colors duration-200 focus-ring rounded">
                          {title}
                        </Link>
                      </h4>
                      <p className="type-small text-[var(--text-muted)] truncate">
                        {[event.venue, place].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    <div className="hidden sm:flex shrink-0 items-center gap-4">
                      {typeLabel && (
                        <span className="type-small uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          {typeLabel}
                        </span>
                      )}
                      {proofLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 focus-ring rounded whitespace-nowrap"
                        >
                          {link.label}
                          <span className="sr-only"> from {title}</span>
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}
