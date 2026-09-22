/**
 * JSON-LD structured data for Events and Products.
 * Inject script with type="application/ld+json" in relevant pages.
 */

import type { EventBookingStatus } from '@/lib/types/content';

export interface EventJsonLdInput {
  name: string;
  startDate: string;
  endDate?: string;
  location?: { name?: string | null; city?: string | null; country?: string | null; url?: string | null };
  description?: string;
  url?: string;
  image?: string;
  bookingStatus?: EventBookingStatus | null;
  ticketUrl?: string | null;
  performerName?: string;
}

/** Google only treats `offers` as valid when it can reach a ticket page. */
const AVAILABILITY: Record<EventBookingStatus, string | null> = {
  announced: 'PreOrder',
  on_sale: 'InStock',
  sold_out: 'SoldOut',
  cancelled: null,
};

/**
 * MusicEvent (a subtype of Event) is the correct type for a live show by a
 * musical act and is what unlocks Google's event rich results. Every optional
 * key is omitted rather than emitted empty, because an empty string in JSON-LD
 * is treated as a malformed value, not as "unknown".
 */
export function eventJsonLd(event: EventJsonLdInput): object {
  const bookingStatus = event.bookingStatus ?? 'announced';
  const availability = AVAILABILITY[bookingStatus];
  const placeName = event.location?.name || event.location?.city || null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate && { endDate: event.endDate }),
    eventStatus:
      bookingStatus === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(placeName && {
      location: {
        '@type': 'Place',
        name: placeName,
        ...(event.location?.url && { url: event.location.url }),
        ...((event.location?.city || event.location?.country) && {
          address: {
            '@type': 'PostalAddress',
            ...(event.location.city && { addressLocality: event.location.city }),
            ...(event.location.country && { addressCountry: event.location.country }),
          },
        }),
      },
    }),
    ...(event.performerName && {
      performer: { '@type': 'MusicGroup', name: event.performerName },
    }),
    ...(event.description && { description: event.description }),
    ...(event.url && { url: event.url }),
    ...(event.image && { image: event.image }),
    ...(event.ticketUrl &&
      availability && {
        offers: {
          '@type': 'Offer',
          url: event.ticketUrl,
          availability: `https://schema.org/${availability}`,
        },
      }),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description?: string;
  image?: string[];
  offers?: { price: number; priceCurrency: string; availability: string };
  url?: string;
}

export function productJsonLd(product: ProductJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description && { description: product.description }),
    ...(product.image?.length && { image: product.image }),
    ...(product.url && { url: product.url }),
    ...(product.offers && {
      offers: {
        '@type': 'Offer',
        price: product.offers.price,
        priceCurrency: product.offers.priceCurrency,
        availability: `https://schema.org/${product.offers.availability}`,
      },
    }),
  };
}

export interface AboutPageJsonLdInput {
  name: string;
  description: string;
  url: string;
  /** Published chapters only. Empty list omits mainEntity rather than inventing history. */
  chapters?: { name: string; description?: string }[];
}

export interface CollectionPageJsonLdInput {
  name: string;
  description: string;
  url: string;
  /** Published, non-empty stories only. Empty list omits mainEntity. */
  stories?: { name: string; url: string; description?: string; image?: string }[];
}

/** CollectionPage for /collections. Stories become an ItemList only when some are live. */
export function collectionPageJsonLd(page: CollectionPageJsonLdInput): object {
  const stories = (page.stories ?? []).filter((s) => s.name.trim().length > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.name,
    description: page.description,
    url: page.url,
    ...(stories.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: stories.map((story, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: story.url,
          item: {
            '@type': 'ImageGallery',
            name: story.name,
            url: story.url,
            ...(story.description && { description: story.description }),
            ...(story.image && { image: story.image }),
          },
        })),
      },
    }),
  };
}

export interface ImageGalleryJsonLdInput {
  name: string;
  description?: string;
  url: string;
  image?: string[];
}

/** ImageGallery for a single published story. Images omitted when none resolve. */
export function imageGalleryJsonLd(gallery: ImageGalleryJsonLdInput): object {
  const images = (gallery.image ?? []).filter((url) => url.trim().length > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.name,
    url: gallery.url,
    ...(gallery.description && { description: gallery.description }),
    ...(images.length > 0 && { image: images }),
  };
}

export interface MusicGroupJsonLdInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  sameAs?: (string | null | undefined)[];
  members?: { name: string }[];
}

/**
 * MusicGroup for the artist entity. Empty sameAs / members are omitted so we
 * never emit invented profiles or lineup.
 */
export function musicGroupJsonLd(group: MusicGroupJsonLdInput): object {
  const sameAs = (group.sameAs ?? []).filter((u): u is string => Boolean(u && u.trim()));
  const members = (group.members ?? []).filter((m) => m.name.trim().length > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: group.name,
    url: group.url,
    ...(group.description && { description: group.description }),
    ...(group.image && { image: group.image }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(members.length > 0 && {
      member: members.map((m) => ({ '@type': 'Person', name: m.name })),
    }),
  };
}

export interface ReleaseJsonLdInput {
  name: string;
  url: string;
  releaseType: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  sameAs?: (string | null | undefined)[];
  artistName: string;
  artistUrl: string;
}

/** Albums and EPs are MusicAlbum; singles, remixes, and mixes are MusicRecording. */
export function releaseJsonLd(release: ReleaseJsonLdInput): object {
  const isAlbum = release.releaseType === 'album' || release.releaseType === 'ep';
  const sameAs = (release.sameAs ?? []).filter((u): u is string => Boolean(u && u.trim()));
  return {
    '@context': 'https://schema.org',
    '@type': isAlbum ? 'MusicAlbum' : 'MusicRecording',
    name: release.name,
    url: release.url,
    ...(release.image && { image: release.image }),
    ...(release.datePublished && { datePublished: release.datePublished }),
    ...(release.description && { description: release.description }),
    byArtist: { '@type': 'MusicGroup', name: release.artistName, url: release.artistUrl },
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList for shareable detail URLs. Empty names are dropped. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): object {
  const crumbs = items.filter((item) => item.name.trim().length > 0 && item.url.trim().length > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** AboutPage for /journey. Chapters become an ItemList only when the artist has published some. */
export function aboutPageJsonLd(page: AboutPageJsonLdInput): object {
  const chapters = (page.chapters ?? []).filter((c) => c.name.trim().length > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: page.name,
    description: page.description,
    url: page.url,
    ...(chapters.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: chapters.map((chapter, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: chapter.name,
          ...(chapter.description && { description: chapter.description }),
        })),
      },
    }),
  };
}
