/**
 * Client-safe press-kit helpers. Empty optional fields stay empty — never a
 * placeholder string — so the public page can omit whole sections.
 */

import { normalizeHeroEmbed } from '@/lib/embed';
import type { PressKit, PresskitPerformance, SiteSettings } from '@/lib/types/content';

export function presskitShortBio(kit: PressKit | null): string | null {
  const short = kit?.short_bio?.trim();
  if (short) return short;
  return null;
}

export function presskitLongBio(kit: PressKit | null): string | null {
  const long = kit?.long_bio?.trim() || kit?.bio_text?.trim();
  return long || null;
}

export function performanceLine(row: PresskitPerformance): string {
  const place = [row.venue, row.city, row.country].filter(Boolean).join(', ');
  return [row.year ? String(row.year) : null, row.label, place || null].filter(Boolean).join(' · ');
}

export function bookingContact(kit: PressKit | null, settings: SiteSettings | null): {
  name: string | null;
  email: string | null;
  phone: string | null;
} {
  return {
    name: kit?.booking_contact_name?.trim() || null,
    email: kit?.booking_contact_email?.trim() || settings?.booking_email?.trim() || null,
    phone: kit?.booking_contact_phone?.trim() || settings?.booking_phone?.trim() || null,
  };
}

/** YouTube watch/share/embed URL → embed src. Null if it is not YouTube. */
export function reelEmbedUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const normalized = normalizeHeroEmbed(trimmed);
  if (normalized?.provider === 'youtube') return `${normalized.embed_url}?rel=0&modestbranding=1&cc_load_policy=1`;
  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
      return `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1&cc_load_policy=1`;
    }
  } catch {
    // not a URL
  }
  return null;
}
