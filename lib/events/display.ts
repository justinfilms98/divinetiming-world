/**
 * Presentation helpers shared by the public event card, the event detail card
 * and the /events page. Client-safe (no server imports) so the animated card
 * can use them too.
 *
 * Every helper returns null/empty rather than a placeholder string: optional
 * fields are genuinely absent on older events, and rendering "—" or an empty
 * label is what leaves orphaned dividers on the page.
 */

import type { Event, EventBookingStatus, EventType } from '@/lib/types/content';
import { EVENT_BOOKING_STATUS_LABELS, EVENT_TYPE_LABELS } from '@/lib/types/content';

/** "Berlin, Germany" — falls back to whichever half exists. */
export function eventPlace(event: Event): string {
  return [event.city, event.country].filter(Boolean).join(', ');
}

/** "Berghain · Berlin, Germany" for the card subtitle. */
export function eventLocationLine(event: Event): string {
  return [event.venue, eventPlace(event)].filter(Boolean).join(' · ');
}

export function eventTypeLabel(type: EventType | null | undefined): string | null {
  return type ? EVENT_TYPE_LABELS[type] : null;
}

export function bookingStatusLabel(status: EventBookingStatus | null | undefined): string | null {
  return status ? EVENT_BOOKING_STATUS_LABELS[status] : null;
}

export function isPastEvent(event: Event, now: number = Date.now()): boolean {
  return new Date(event.date).getTime() < now;
}

export type TicketState =
  /** Ticket URL is live and should be the primary CTA. */
  | { kind: 'available'; url: string }
  /** Show the status instead of a link — a dead ticket link costs trust. */
  | { kind: 'sold_out' }
  | { kind: 'cancelled' }
  /** Nothing to say about ticketing: render no CTA and no badge. */
  | { kind: 'none' };

/**
 * A ticket link is shown whenever one exists and the show is neither sold out
 * nor cancelled — an "announced" date with a presale link still converts, so
 * gating strictly on 'on_sale' would throw away real bookings.
 */
export function ticketState(event: Event, isPast = isPastEvent(event)): TicketState {
  if (event.booking_status === 'cancelled') return { kind: 'cancelled' };
  if (isPast) return { kind: 'none' };
  if (event.booking_status === 'sold_out') return { kind: 'sold_out' };
  const url = event.ticket_url?.trim();
  return url ? { kind: 'available', url } : { kind: 'none' };
}

/** Post-show proof links. Empty array means the card renders no proof row at all. */
export function eventProofLinks(event: Event): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  const recap = event.recap_video_url?.trim();
  const gallery = event.gallery_url?.trim();
  if (recap) links.push({ label: 'Watch recap', href: recap });
  if (gallery) links.push({ label: 'View photos', href: gallery });
  return links;
}

/**
 * Real, derived summary of where the duo has played — counted from published
 * past events only. Returns null below three shows so the page never leans on a
 * stat that reads as thin rather than as proof.
 */
export function touringSummary(pastEvents: Event[]): string | null {
  if (pastEvents.length < 3) return null;
  const cities = new Set(
    pastEvents.map((e) => e.city?.trim().toLowerCase()).filter((c): c is string => !!c)
  );
  const countries = new Set(
    pastEvents.map((e) => e.country?.trim().toLowerCase()).filter((c): c is string => !!c)
  );

  const parts = [
    `${pastEvents.length} shows`,
    cities.size > 1 ? `${cities.size} cities` : null,
    countries.size > 1 ? `${countries.size} countries` : null,
  ].filter(Boolean);

  return parts.join(' · ');
}
