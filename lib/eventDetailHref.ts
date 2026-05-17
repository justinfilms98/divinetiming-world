/**
 * Client-safe: pure function for event detail URL. Use in EventCard and any client component.
 * For server-only thumbnail resolution use @/lib/eventMedia.
 */

import type { Event } from '@/lib/types/content';

/** Safe event URL path: prefer slug (lowercase), else id. Use for links to detail page. */
export function eventDetailHref(event: Event): string {
  if (event.slug && event.slug.trim()) return `/events/${event.slug.trim().toLowerCase()}`;
  return `/events/${event.id}`;
}
