'use client';

import Link from 'next/link';
import type { Event } from '@/lib/types/content';
import { eventDetailHref } from '@/lib/eventDetailHref';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics/track';

interface EventCardProps {
  event: Event;
  isPast?: boolean;
}

function formatMonth(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatDay(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric' });
}

function formatYear(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' });
}

function EventCardPlaceholder({ monthLabel }: { monthLabel: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] border border-[var(--accent)]/10"
      aria-hidden
    >
      <span
        className="text-[var(--text-muted)]/30 text-5xl font-light tracking-[0.2em]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {monthLabel}
      </span>
    </div>
  );
}

export function EventCard({ event, isPast = false }: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;
  const imageUrl = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;
  const href = eventDetailHref(event);
  const monthLabel = formatMonth(event.date);
  const dayLabel = formatDay(event.date);
  const yearLabel = formatYear(event.date);

  const handleClick = () => {
    track({ event_name: 'event_card_click', entity_type: 'event', entity_id: event.id });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-[var(--bg-secondary)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 luxury-card card-atmosphere"
    >
      <Link
        href={href}
        onClick={handleClick}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[var(--bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        {imageUrl ? (
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
            <MediaAssetRenderer
              url={imageUrl}
              mediaType="image"
              alt={title}
              fallback={<EventCardPlaceholder monthLabel={monthLabel} />}
              errorFallback={<EventCardPlaceholder monthLabel={monthLabel} />}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <EventCardPlaceholder monthLabel={monthLabel} />
        )}

        {/* Date badge overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-white">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--accent)]">{monthLabel}</span>
          <span className="text-2xl leading-none font-light" style={{ fontFamily: 'var(--font-display)' }}>{dayLabel}</span>
          <span className="text-[10px] tracking-wider opacity-70">{yearLabel}</span>
        </div>

        {/* Bottom gradient for legibility if needed */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" aria-hidden />
      </Link>

      <div className="flex-1 flex flex-col p-6 gap-3">
        <Link
          href={href}
          onClick={handleClick}
          className="flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 rounded-lg -m-1 p-1"
        >
          <h3
            className="type-h3 text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h3>
          {location && (
            <p className="type-small mt-1.5 text-[var(--text-muted)] tracking-wide">{location}</p>
          )}
          {event.description && (
            <p className="text-[var(--text-muted)] text-sm mt-3 line-clamp-2 leading-relaxed">{event.description}</p>
          )}
        </Link>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          {!isPast && event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] font-medium type-button hover:bg-[var(--accent-hover)] transition-all duration-200 glow focus-ring"
            >
              Get Tickets
            </a>
          )}
          <Link
            href={href}
            onClick={handleClick}
            className="min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center rounded-[var(--radius-button)] border border-[var(--accent)]/40 text-[var(--text)] font-medium type-button hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all duration-200 focus-ring"
          >
            {isPast ? 'View Recap' : 'Details'}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
