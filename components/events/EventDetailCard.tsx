'use client';

import { useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, Building2, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { Event } from '@/lib/types/content';

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
  value: string;
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

  const location = [event.venue, event.city].filter(Boolean).join(', ') || '—';

  return (
    <Card as="aside" className="p-6 lg:sticky lg:top-24 space-y-6" aria-label="Event details">
      <MetaRow icon={Calendar} label="Date" value={formatDate(event.date)} />
      {event.time && (
        <MetaRow icon={Clock} label="Time" value={event.time} />
      )}
      {event.venue && (
        <MetaRow icon={Building2} label="Venue" value={event.venue} />
      )}
      {event.city && (
        <MetaRow icon={MapPin} label="Location" value={event.city} />
      )}

      {event.ticket_url && (
        <div className="pt-2">
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[48px] w-full px-6 py-3.5 rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] font-semibold type-button transition-[filter,box-shadow] duration-[200ms] ease-out hover:brightness-[1.08] hover:shadow-[var(--shadow-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
          >
            Get Tickets
          </a>
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
