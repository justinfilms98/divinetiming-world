'use client';

import { useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, Building2, Link2, Sparkles, ExternalLink, Images, Film } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { Event } from '@/lib/types/content';
import { eventPlace, eventTypeLabel, isPastEvent, ticketState } from '@/lib/events/display';

interface EventDetailCardProps {
  event: Event;
  /** Path only (e.g. /events/my-event). Client builds full URL when copying. */
  sharePath: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 mt-0.5 text-[var(--accent)]" aria-hidden>
        <Icon size={18} className="shrink-0" />
      </span>
      <div className="min-w-0">
        <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>
          {label}
        </span>
        <p className="text-[var(--text)] font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function EventDetailCard({ event, sharePath }: EventDetailCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${sharePath}` : sharePath;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sharePath]);

  const place = eventPlace(event);
  const typeLabel = eventTypeLabel(event.event_type);
  const tickets = ticketState(event, isPastEvent(event));
  const venueUrl = event.venue_url?.trim() || null;
  const galleryUrl = event.gallery_url?.trim() || null;
  const recapUrl = event.recap_video_url?.trim() || null;
  const hasProofLinks = !!(galleryUrl || recapUrl);

  return (
    <Card as="aside" className="p-6 lg:sticky lg:top-24 space-y-6" aria-label="Event details">
      <MetaRow icon={Calendar} label="Date" value={formatDate(event.date)} />
      {event.time && (
        <MetaRow icon={Clock} label="Time" value={event.time} />
      )}
      {typeLabel && (
        <MetaRow icon={Sparkles} label="Type" value={typeLabel} />
      )}
      {event.venue && (
        venueUrl ? (
          <MetaRow
            icon={Building2}
            label="Venue"
            value={
              <a
                href={venueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--accent)] transition-colors duration-200 focus-ring rounded"
              >
                {event.venue}
                <ExternalLink size={13} aria-hidden className="shrink-0 opacity-70" />
                <span className="sr-only">(opens venue website in a new tab)</span>
              </a>
            }
          />
        ) : (
          <MetaRow icon={Building2} label="Venue" value={event.venue} />
        )
      )}
      {place && (
        <MetaRow icon={MapPin} label="Location" value={place} />
      )}

      {tickets.kind === 'available' && (
        <div className="pt-2">
          <a
            href={tickets.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[48px] w-full px-6 py-3.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] font-semibold type-button transition-[filter,box-shadow] duration-[200ms] ease-out hover:brightness-[1.08] hover:shadow-[var(--shadow-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
          >
            Get tickets
          </a>
        </div>
      )}

      {/* A dead ticket link costs more trust than an honest status. */}
      {(tickets.kind === 'sold_out' || tickets.kind === 'cancelled') && (
        <p
          className={`flex items-center justify-center min-h-[48px] w-full px-6 py-3.5 rounded-[var(--radius-button)] border type-button font-semibold ${
            tickets.kind === 'cancelled'
              ? 'border-red-400/40 text-red-300'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {tickets.kind === 'cancelled' ? 'Cancelled' : 'Sold out'}
        </p>
      )}

      {hasProofLinks && (
        <div className="pt-4 border-t border-[var(--accent)]/15 space-y-3">
          {recapUrl && (
            <a
              href={recapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 text-sm font-medium focus-ring rounded"
            >
              <Film size={16} aria-hidden />
              Watch the recap
            </a>
          )}
          {galleryUrl && (
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 text-sm font-medium focus-ring rounded"
            >
              <Images size={16} aria-hidden />
              Photo gallery
            </a>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-[var(--accent)]/15">
        <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>
          Share
        </span>
        <button
          type="button"
          onClick={handleCopyLink}
          className="mt-2 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 text-sm font-medium"
        >
          <Link2 size={16} />
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </Card>
  );
}
