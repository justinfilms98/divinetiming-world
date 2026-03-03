'use client';

import Link from 'next/link';
import type { Event } from '@/lib/types/content';
import { eventDetailHref } from '@/lib/eventDetailHref';
import { MediaAssetRenderer, MediaUnavailableFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics/track';

interface EventCardProps {
  event: Event;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Premium placeholder when no image: neutral, no "No Image" text */
function EventCardPlaceholder({ dateLabel }: { dateLabel: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] border border-[var(--accent)]/10"
      aria-hidden
    >
      <span className="text-[var(--text-muted)]/40 text-3xl font-light tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
        {dateLabel}
      </span>
    </div>
  );
}

export function EventCard({ event }: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;
  const imageUrl = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;
  const href = eventDetailHref(event);

  const handleClick = () => {
    track({ event_name: 'event_card_click', entity_type: 'event', entity_id: event.id });
  };

  const dateLabel = new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group flex flex-col md:flex-row gap-6 p-0 rounded-2xl border border-[var(--accent)]/25 overflow-hidden transition-all duration-300 bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.995] luxury-card"
    >
      <Link href={href} className="md:w-56 md:flex-shrink-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden" onClick={handleClick}>
        <div className="relative aspect-[16/9] md:aspect-[4/3] w-full overflow-hidden bg-[var(--bg)]">
          {imageUrl ? (
            <MediaAssetRenderer
              url={imageUrl}
              mediaType="image"
              alt={title}
              fallback={<EventCardPlaceholder dateLabel={dateLabel} />}
              errorFallback={<EventCardPlaceholder dateLabel={dateLabel} />}
              sizes="(max-width: 768px) 100vw, 224px"
            />
          ) : (
            <EventCardPlaceholder dateLabel={dateLabel} />
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 min-w-0">
        <Link href={href} className="flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 rounded-lg -m-1 p-1" onClick={handleClick}>
          <div className="type-label text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors duration-300">
            {formatDate(event.date)}
            {event.time && ` · ${event.time}`}
          </div>
          <h3 className="type-h3 text-[var(--text)] group-hover:text-[var(--accent)] mt-1.5 transition-colors duration-300" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h3>
          <p className="type-small mt-1 text-[var(--text-muted)]">{location}</p>
          {event.description && (
            <p className="text-[var(--text-muted)] text-sm mt-2 line-clamp-2">{event.description}</p>
          )}
        </Link>

        {event.ticket_url && (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-center min-h-[48px] px-6 py-3 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] font-medium type-button hover:bg-[var(--accent-hover)] transition-all duration-300 glow focus-ring"
          >
            Tickets
          </a>
        )}
      </div>
    </motion.article>
  );
}
