/**
 * Creative dashboard home: shared types and the pure rules behind "Needs attention",
 * fan activity and the storage meter. No I/O here, so every rule is unit tested.
 * Nothing in this module (or the overview endpoint) writes to the database.
 */

export type Severity = 'urgent' | 'important' | 'reminder';

export interface AttentionItem {
  /** Stable key, used to snooze the item on this device. */
  id: string;
  severity: Severity;
  title: string;
  /** Plain-language reason it matters. */
  detail: string;
  href: string;
  action: string;
  /** Urgent items cannot be snoozed. */
  snoozable: boolean;
}

export interface OverviewEvent {
  id: string;
  title: string | null;
  city: string | null;
  venue: string | null;
  date: string;
  status: string | null;
  booking_status: string | null;
  ticket_url: string | null;
  artwork_url: string | null;
  /** Artwork exists but is too large to preview cheaply (see PREVIEW_MAX_BYTES). */
  artwork_too_large?: boolean;
  updated_at: string | null;
  description?: string | null;
  gallery_url?: string | null;
  /** Count of rows in event_media (optional enrichment for missions). */
  media_count?: number;
}

export interface OverviewDraftable {
  id: string;
  name: string;
  status: string | null;
  updated_at: string | null;
}

export interface OverviewCollection extends OverviewDraftable {
  has_cover?: boolean;
  frame_count?: number;
}

export interface OverviewProduct extends OverviewDraftable {
  price_cents: number | null;
  image_count: number;
  description?: string | null;
  track_inventory?: boolean | null;
  inventory_count?: number | null;
  variants?: { track_inventory: boolean | null; inventory_count: number | null }[];
}

export interface OverviewJournalEpisode {
  id: string;
  title: string;
  status: string | null;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  updated_at: string | null;
  episode_number: number | null;
}

export interface OverviewSocials {
  instagram_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  soundcloud_url: string | null;
  beatport_url: string | null;
}

export type MissionCategory = 'merchandise' | 'events' | 'journal' | 'website';

export interface MissionItem {
  /** Stable key for snooze / dismiss on this device. */
  id: string;
  category: MissionCategory;
  title: string;
  detail: string;
  href: string;
  action: string;
  snoozable: boolean;
}

export interface MissionInput {
  events: OverviewEvent[];
  collections: OverviewCollection[];
  products: OverviewProduct[];
  journal: OverviewJournalEpisode[];
  socials: OverviewSocials | null;
  /** Attention ids already emitted — missions never repeat the same concern. */
  attentionIds: string[];
}

export interface OverviewInquiry {
  id: string;
  name: string | null;
  event_name: string | null;
  status: string | null;
  created_at: string;
}

export interface OverviewPolicy {
  slug: string;
  title: string | null;
  status: string | null;
}

export interface OverviewHeroSlot {
  page_slug: string;
  slot_index: number;
  /** Enabled video slot with no poster of its own and no web-rendition poster. */
  missing_poster: boolean;
}

export interface AttentionInput {
  events: OverviewEvent[];
  collections: OverviewDraftable[];
  products: OverviewProduct[];
  releases: OverviewDraftable[];
  inquiries: OverviewInquiry[];
  policies: OverviewPolicy[];
  heroSlots: OverviewHeroSlot[];
  /** Whether any product is publicly visible (demo or not). Defaults to the products given. */
  shopIsLive?: boolean;
}

const DAY_MS = 86_400_000;
export const STALE_DRAFT_DAYS = 7;
export const INQUIRY_REPLY_DAYS = 2;
export const UPCOMING_WINDOW_DAYS = 30;
export const URGENT_EVENT_DAYS = 14;
/** Draft products with photo + price waiting this long become a “ready to review” mission. */
export const MISSION_DRAFT_READY_DAYS = 3;
/** Descriptions shorter than this count as missing copy for missions. */
export const MISSION_MIN_COPY_CHARS = 40;
/** Cap on “Your next moves” after sort (mobile-first). */
export const MISSION_CAP = 5;
/** Images larger than this are not previewed on the dashboard (each optimizer fetch downloads the full original). */
export const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;

const SEVERITY_RANK: Record<Severity, number> = { urgent: 0, important: 1, reminder: 2 };

const daysBetween = (from: number, to: number) => Math.floor((to - from) / DAY_MS);
const daysUntil = (now: number, when: number) => Math.max(0, Math.ceil((when - now) / DAY_MS));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const quoted = (s: string) => `“${s}”`;

function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function eventLabel(e: Pick<OverviewEvent, 'title' | 'city' | 'venue'>): string {
  return e.title?.trim() || [e.venue, e.city].filter(Boolean).join(', ') || 'Untitled event';
}

function inquiryItems(inquiries: OverviewInquiry[], now: number): AttentionItem[] {
  const waiting = inquiries
    .filter((i) => (i.status ?? 'new') === 'new' && daysBetween(Date.parse(i.created_at), now) >= INQUIRY_REPLY_DAYS)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  if (waiting.length === 0) return [];
  const oldestDays = daysBetween(Date.parse(waiting[0].created_at), now);
  if (waiting.length === 1) {
    const i = waiting[0];
    return [
      {
        id: `inquiry:${i.id}`,
        severity: 'urgent',
        title: `${i.name?.trim() || 'A booking inquiry'} is waiting for a reply`,
        detail: `Booking inquiry${i.event_name ? ` for ${quoted(i.event_name)}` : ''} received ${plural(oldestDays, 'day')} ago and still marked New.`,
        href: `/admin/booking-inquiries?status=new#inquiry-${i.id}`,
        action: 'Open inquiry',
        snoozable: false,
      },
    ];
  }
  return [
    {
      id: 'inquiries:waiting',
      severity: 'urgent',
      title: `${waiting.length} booking inquiries are waiting for a reply`,
      detail: `The oldest arrived ${plural(oldestDays, 'day')} ago. They stay marked New until you update them.`,
      href: '/admin/booking-inquiries?status=new',
      action: 'Open inquiries',
      snoozable: false,
    },
  ];
}

function eventItems(events: OverviewEvent[], now: number): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const e of events) {
    const when = Date.parse(e.date);
    if (Number.isNaN(when) || when < now || when > now + UPCOMING_WINDOW_DAYS * DAY_MS) continue;
    if (e.booking_status === 'cancelled') continue;
    const days = daysUntil(now, when);
    const label = eventLabel(e);
    const where = e.city ? ` in ${e.city}` : '';
    const href = `/admin/events?edit=${e.id}`;

    if (e.status === 'published') {
      const missing: string[] = [];
      if (!e.artwork_url) missing.push('a photo');
      // Only events marked "On sale" need a ticket link; free or invite-only events are fine without one.
      if (e.booking_status === 'on_sale' && !e.ticket_url?.trim()) missing.push('a ticket link');
      if (missing.length === 0) continue;
      const urgent = days <= URGENT_EVENT_DAYS;
      items.push({
        id: `event:${e.id}:incomplete`,
        severity: urgent ? 'urgent' : 'important',
        title: `${quoted(label)} needs ${listJoin(missing)}`,
        detail: `Happening in ${plural(days, 'day')}${where} and already live on the Events page${
          missing.includes('a ticket link') ? ', marked “On sale” with nowhere to buy' : ''
        }.`,
        href,
        action: 'Edit event',
        snoozable: !urgent,
      });
    } else if (e.status === 'draft' && days <= URGENT_EVENT_DAYS) {
      items.push({
        id: `event:${e.id}:unpublished`,
        severity: 'important',
        title: `${quoted(label)} isn't published yet`,
        detail: `It's ${plural(days, 'day')} away${where} and hidden from the Events page. Publish it when the details are final.`,
        href,
        action: 'Review event',
        snoozable: true,
      });
    }
  }
  return items;
}

function productItems(products: OverviewProduct[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const p of products) {
    if (p.status !== 'published') continue;
    const missing: string[] = [];
    if (p.image_count === 0) missing.push('a photo');
    if (!p.price_cents || p.price_cents <= 0) missing.push('a price');
    if (missing.length === 0) continue;
    items.push({
      id: `product:${p.id}:incomplete`,
      severity: 'urgent',
      title: `${quoted(p.name)} is in the Shop without ${listJoin(missing)}`,
      detail: 'Visitors can already see this product. Add the missing details or switch it back to Draft.',
      href: `/admin/shop?edit=${p.id}`,
      action: 'Edit product',
      snoozable: false,
    });
  }
  return items;
}

const POLICY_SHORT_NAME: Record<string, string> = { privacy: 'Privacy', terms: 'Terms', refund: 'Refund', shipping: 'Shipping' };

function policyItems(policies: OverviewPolicy[], shopIsLive: boolean): AttentionItem[] {
  const relevant = policies.filter((p) => shopIsLive || p.slug === 'privacy' || p.slug === 'terms');
  const unpublished = relevant.filter((p) => p.status !== 'published');
  if (unpublished.length === 0) return [];
  const names = unpublished.map((p) => POLICY_SHORT_NAME[p.slug] ?? (p.title?.trim() || p.slug));
  const one = unpublished.length === 1;
  return [
    {
      id: `policies:${unpublished.map((p) => p.slug).sort().join(',')}`,
      severity: 'important',
      title: unpublished.length === relevant.length ? 'Legal pages are not published yet' : `${listJoin(names)} ${one ? 'is' : 'are'} not published yet`,
      detail: `${listJoin(names)} ${one ? 'is' : 'are'} linked from every page footer${shopIsLive ? ' and the Shop' : ''}. Until ${
        one ? 'it is' : 'they are'
      } published, visitors see a “being finalised” notice.`,
      href: '/admin/policies',
      action: 'Open legal pages',
      snoozable: true,
    },
  ];
}

const PAGE_LABEL: Record<string, string> = { home: 'Homepage' };

function heroItems(slots: OverviewHeroSlot[]): AttentionItem[] {
  const byPage = new Map<string, number[]>();
  for (const s of slots) {
    if (!s.missing_poster) continue;
    byPage.set(s.page_slug, [...(byPage.get(s.page_slug) ?? []), s.slot_index]);
  }
  return [...byPage.entries()].map(([page, indexes]) => {
    const where = PAGE_LABEL[page] ?? `${page.charAt(0).toUpperCase()}${page.slice(1)} page`;
    return {
      id: `hero:${page}:${indexes.sort().join(',')}`,
      severity: 'reminder' as const,
      title:
        indexes.length === 1
          ? `${where} video ${indexes[0]} has no poster image`
          : `${indexes.length} ${where.toLowerCase()} videos have no poster image`,
      detail: 'Visitors on slow connections see a blank frame until the video loads. Add a still image as the poster.',
      href: '/admin/hero',
      action: 'Open homepage editor',
      snoozable: true,
    };
  });
}

const DRAFT_KINDS = [
  { key: 'events', noun: 'event', list: '/admin/events' },
  { key: 'collections', noun: 'collection', list: '/admin/collections' },
  { key: 'products', noun: 'product', list: '/admin/shop' },
  { key: 'releases', noun: 'release', list: '/admin/releases' },
] as const;

function staleDraftItems(input: AttentionInput, now: number, alreadyFlagged: Set<string>): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const kind of DRAFT_KINDS) {
    const rows: OverviewDraftable[] =
      kind.key === 'events'
        ? input.events.map((e) => ({ id: e.id, name: eventLabel(e), status: e.status, updated_at: e.updated_at }))
        : input[kind.key];
    const stale = rows
      .filter((r) => r.status === 'draft' && !alreadyFlagged.has(r.id))
      .map((r) => ({ ...r, age: r.updated_at ? daysBetween(Date.parse(r.updated_at), now) : STALE_DRAFT_DAYS }))
      .filter((r) => r.age >= STALE_DRAFT_DAYS)
      .sort((a, b) => b.age - a.age);
    if (stale.length === 0) continue;
    if (stale.length === 1) {
      const r = stale[0];
      items.push({
        id: `drafts:${kind.key}:${r.id}`,
        severity: 'reminder',
        title: `${quoted(r.name)} is still a draft`,
        detail: `Last edited ${plural(r.age, 'day')} ago. It stays hidden from the site until you publish it.`,
        href: `${kind.list}?edit=${r.id}`,
        action: `Open ${kind.noun}`,
        snoozable: true,
      });
    } else {
      items.push({
        id: `drafts:${kind.key}`,
        severity: 'reminder',
        title: `${stale.length} ${kind.noun} drafts are waiting`,
        detail: `The oldest was last edited ${plural(stale[0].age, 'day')} ago. Drafts stay hidden from the site until you publish them.`,
        href: kind.list,
        action: `Open ${kind.noun}s`,
        snoozable: true,
      });
    }
  }
  return items;
}

/** Ordered most urgent first. Never more than one grouped item per rule and content type. */
export function buildAttention(input: AttentionInput, nowDate: Date): AttentionItem[] {
  const now = nowDate.getTime();
  const shopIsLive = input.shopIsLive ?? input.products.some((p) => p.status === 'published');
  const events = eventItems(input.events, now);
  const flaggedEventIds = new Set(events.map((i) => i.id.split(':')[1]));
  const items = [
    ...inquiryItems(input.inquiries, now),
    ...events,
    ...productItems(input.products),
    ...policyItems(input.policies, shopIsLive),
    ...heroItems(input.heroSlots),
    ...staleDraftItems(input, now, flaggedEventIds),
  ];
  return items
    .map((item, order) => ({ item, order }))
    .sort((a, b) => SEVERITY_RANK[a.item.severity] - SEVERITY_RANK[b.item.severity] || a.order - b.order)
    .map(({ item }) => item);
}

/** Items still hidden by a snooze. `snoozes` maps item id → ISO time the snooze ends. */
export function visibleAttention(items: AttentionItem[], snoozes: Record<string, string>, nowDate: Date) {
  const now = nowDate.getTime();
  const visible: AttentionItem[] = [];
  let snoozed = 0;
  for (const item of items) {
    const until = snoozes[item.id] ? Date.parse(snoozes[item.id]) : NaN;
    if (item.snoozable && !Number.isNaN(until) && until > now) snoozed++;
    else visible.push(item);
  }
  return { visible, snoozed };
}

// ---------------------------------------------------------------------------------------------
// Mission Board (“Your next moves”) — proactive suggestions; never duplicates Needs Attention

const MISSION_CATEGORY_RANK: Record<MissionCategory, number> = {
  merchandise: 0,
  events: 1,
  journal: 2,
  website: 3,
};

const CATEGORY_LABEL: Record<MissionCategory, string> = {
  merchandise: 'Merch',
  events: 'Events',
  journal: 'Journal',
  website: 'Website',
};

export function missionCategoryLabel(category: MissionCategory): string {
  return CATEGORY_LABEL[category];
}

function copyMissing(text: string | null | undefined): boolean {
  return (text?.trim().length ?? 0) < MISSION_MIN_COPY_CHARS;
}

function productOutOfStock(p: OverviewProduct): boolean {
  if (p.track_inventory) return (p.inventory_count ?? 0) <= 0;
  const tracked = (p.variants ?? []).filter((v) => v.track_inventory);
  if (tracked.length === 0) return false;
  return tracked.every((v) => (v.inventory_count ?? 0) <= 0);
}

function mission(
  id: string,
  category: MissionCategory,
  title: string,
  detail: string,
  href: string,
  action: string
): MissionItem {
  return { id, category, title, detail, href, action, snoozable: true };
}

function merchandiseMissions(products: OverviewProduct[], attentionIds: Set<string>, now: number): MissionItem[] {
  const items: MissionItem[] = [];
  const active = products.filter((p) => p.status === 'draft' || p.status === 'published');
  if (active.length === 0) {
    items.push(
      mission(
        'mission:shop:empty-real',
        'merchandise',
        'Add a real merch product',
        'The Shop only has demonstration items (or none). Add a product Lex and Liam can finish and sell.',
        '/admin/shop?new=1',
        'New product'
      )
    );
    return items;
  }

  for (const p of active) {
    if (attentionIds.has(`product:${p.id}:incomplete`)) continue;
    if (copyMissing(p.description)) {
      items.push(
        mission(
          `mission:product:${p.id}:describe`,
          'merchandise',
          `Write a description for ${quoted(p.name)}`,
          'Shoppers need a short product story before they buy.',
          `/admin/shop?edit=${p.id}`,
          'Edit product'
        )
      );
    }
    if (p.status === 'published' && productOutOfStock(p)) {
      items.push(
        mission(
          `mission:product:${p.id}:inventory`,
          'merchandise',
          `${quoted(p.name)} is out of stock`,
          'Inventory tracking is on but stock is zero. Restock or turn tracking off.',
          `/admin/shop?edit=${p.id}`,
          'Update stock'
        )
      );
    }
    if (
      p.status === 'draft' &&
      p.image_count > 0 &&
      (p.price_cents ?? 0) > 0 &&
      p.updated_at &&
      daysBetween(Date.parse(p.updated_at), now) >= MISSION_DRAFT_READY_DAYS
    ) {
      items.push(
        mission(
          `mission:product:${p.id}:review-draft`,
          'merchandise',
          `Review draft ${quoted(p.name)}`,
          `Photo and price are set. Last edited ${plural(daysBetween(Date.parse(p.updated_at), now), 'day')} ago — ready to publish when you are.`,
          `/admin/shop?edit=${p.id}`,
          'Open product'
        )
      );
    }
  }
  return items;
}

function eventMissions(events: OverviewEvent[], attentionIds: Set<string>, now: number): MissionItem[] {
  const items: MissionItem[] = [];
  const pastMissingArt: OverviewEvent[] = [];
  const pastMissingGallery: OverviewEvent[] = [];

  for (const e of events) {
    if (e.booking_status === 'cancelled' || e.status !== 'published') continue;
    const when = Date.parse(e.date);
    if (Number.isNaN(when)) continue;
    const isPast = when < now;
    const label = eventLabel(e);
    const href = `/admin/events?edit=${e.id}`;

    if (isPast && !e.artwork_url && !attentionIds.has(`event:${e.id}:incomplete`)) {
      pastMissingArt.push(e);
    }
    if (isPast && (e.media_count ?? 0) === 0 && !e.gallery_url?.trim()) {
      pastMissingGallery.push(e);
    }
    if (copyMissing(e.description) && !attentionIds.has(`event:${e.id}:incomplete`)) {
      items.push(
        mission(
          `mission:event:${e.id}:copy`,
          'events',
          `Add a story for ${quoted(label)}`,
          isPast
            ? 'Past shows read better with a short recap visitors can share.'
            : 'Give fans a reason to care before the night arrives.',
          href,
          'Edit event'
        )
      );
    }
  }

  if (pastMissingArt.length === 1) {
    const e = pastMissingArt[0];
    items.push(
      mission(
        `mission:event:${e.id}:artwork`,
        'events',
        `Add artwork for ${quoted(eventLabel(e))}`,
        'This past show is live without a flyer. A still image finishes the archive.',
        `/admin/events?edit=${e.id}`,
        'Add artwork'
      )
    );
  } else if (pastMissingArt.length > 1) {
    items.push(
      mission(
        'mission:events:past-artwork',
        'events',
        `${pastMissingArt.length} past events need a flyer`,
        'Published shows without artwork look unfinished in the archive. Start with the most recent.',
        `/admin/events?edit=${pastMissingArt.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0].id}`,
        'Add artwork'
      )
    );
  }

  if (pastMissingGallery.length > 0) {
    const newest = [...pastMissingGallery].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
    items.push(
      mission(
        'mission:events:past-gallery',
        'events',
        pastMissingGallery.length === 1
          ? `Add photos for ${quoted(eventLabel(newest))}`
          : `${pastMissingGallery.length} past events have no photo gallery`,
        'Optional recap media helps fans relive the night. One show at a time is enough.',
        `/admin/events?edit=${newest.id}`,
        'Open event'
      )
    );
  }

  return items;
}

function journalMissions(episodes: OverviewJournalEpisode[]): MissionItem[] {
  const items: MissionItem[] = [];
  for (const ep of episodes) {
    if (ep.status === 'archived' || ep.status === 'published') continue;
    const label = ep.title?.trim() || (ep.episode_number != null ? `Episode ${ep.episode_number}` : 'Untitled episode');
    const missingCover = !ep.cover_image_url?.trim();
    const missingSummary = !(ep.summary?.trim());
    const missingDesc = copyMissing(ep.description);
    const href = `/admin/journal?edit=${ep.id}`;

    if (missingCover || missingSummary || missingDesc) {
      const parts: string[] = [];
      if (missingCover) parts.push('cover');
      if (missingSummary) parts.push('summary');
      if (missingDesc) parts.push('description');
      items.push(
        mission(
          `mission:journal:${ep.id}:incomplete`,
          'journal',
          `Finish ${quoted(label)}`,
          `Still needs ${listJoin(parts)} before it is ready to share.`,
          href,
          'Edit episode'
        )
      );
    } else if (ep.status === 'draft') {
      items.push(
        mission(
          `mission:journal:${ep.id}:ready-review`,
          'journal',
          `Review ${quoted(label)} for publish`,
          'Cover, summary and description are in place. Publish or set Coming soon when you are ready.',
          href,
          'Open episode'
        )
      );
    }
  }
  return items;
}

function websiteMissions(collections: OverviewCollection[], socials: OverviewSocials | null): MissionItem[] {
  const items: MissionItem[] = [];
  for (const c of collections) {
    if (c.status !== 'draft' && c.status !== 'published') continue;
    if (c.status === 'published' && !c.has_cover) {
      items.push(
        mission(
          `mission:collection:${c.id}:cover`,
          'website',
          `Add a cover to ${quoted(c.name)}`,
          'Collection cards look unfinished without a cover image.',
          `/admin/collections?edit=${c.id}`,
          'Edit collection'
        )
      );
    }
    if ((c.frame_count ?? 0) === 0) {
      items.push(
        mission(
          `mission:collection:${c.id}:empty`,
          'website',
          `${quoted(c.name)} has no frames yet`,
          'Add photos so the collection tells a story.',
          `/admin/collections?edit=${c.id}`,
          'Add frames'
        )
      );
    }
  }

  if (socials) {
    const missing: string[] = [];
    if (!socials.instagram_url?.trim()) missing.push('Instagram');
    if (!socials.youtube_url?.trim()) missing.push('YouTube');
    if (!socials.spotify_url?.trim()) missing.push('Spotify');
    if (!socials.apple_music_url?.trim()) missing.push('Apple Music');
    if (!socials.soundcloud_url?.trim()) missing.push('SoundCloud');
    if (!socials.beatport_url?.trim()) missing.push('Beatport');
    if (missing.length > 0) {
      items.push(
        mission(
          'mission:social:missing',
          'website',
          'Add missing social destinations',
          `${listJoin(missing)} ${missing.length === 1 ? 'is' : 'are'} empty in site settings.`,
          '/admin/settings',
          'Open settings'
        )
      );
    }
  }

  return items;
}

/**
 * Proactive next steps for artists. Cap at MISSION_CAP. Merchandise and events sort first.
 * Never emits an id already covered by Needs Attention for the same product/event gap.
 */
export function buildMissions(input: MissionInput, nowDate: Date): MissionItem[] {
  const now = nowDate.getTime();
  const attentionIds = new Set(input.attentionIds);
  const items = [
    ...merchandiseMissions(input.products, attentionIds, now),
    ...eventMissions(input.events, attentionIds, now),
    ...journalMissions(input.journal),
    ...websiteMissions(input.collections, input.socials),
  ];
  return items
    .map((item, order) => ({ item, order }))
    .sort((a, b) => MISSION_CATEGORY_RANK[a.item.category] - MISSION_CATEGORY_RANK[b.item.category] || a.order - b.order)
    .map(({ item }) => item)
    .slice(0, MISSION_CAP);
}

/** Filter missions by device-local snoozes and dismissals. */
export function visibleMissions(
  items: MissionItem[],
  snoozes: Record<string, string>,
  dismissals: string[],
  nowDate: Date
) {
  const dismissed = new Set(dismissals);
  const visible: MissionItem[] = [];
  let snoozed = 0;
  let dismissedCount = 0;
  for (const item of items) {
    if (dismissed.has(item.id)) {
      dismissedCount++;
      continue;
    }
    const until = snoozes[item.id] ? Date.parse(snoozes[item.id]) : NaN;
    if (item.snoozable && !Number.isNaN(until) && until > nowDate.getTime()) {
      snoozed++;
      continue;
    }
    visible.push(item);
  }
  return { visible, snoozed, dismissed: dismissedCount };
}

// ---------------------------------------------------------------------------------------------
// Fan activity (recorded interactions from analytics_events; not unique visitors)

export type ActivityCategory = 'events' | 'collections' | 'products';

const EVENT_CATEGORY: Record<string, ActivityCategory> = {
  event_card_click: 'events',
  gallery_click: 'collections',
  viewer_open: 'collections',
  product_click: 'products',
  add_to_cart: 'products',
};

export interface AnalyticsRow {
  event_name: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface ActivityTarget {
  key: string;
  label: string;
  href: string;
  /** Demonstration content: counted separately, never ranked. */
  demo?: boolean;
}

export interface FanActivity {
  /** Recorded clicks on real (non-demo) content. */
  total: number;
  /** Recorded clicks on demonstration content, excluded from everything else. */
  demoClicks: number;
  byCategory: Record<ActivityCategory, number>;
  /** Oldest first; seven calendar days ending today in `timeZone`. */
  daily: { date: string; count: number }[];
  top: (ActivityTarget & { category: ActivityCategory; count: number })[];
  timeZone: string;
}

/** Calendar date (YYYY-MM-DD) of an instant in an IANA time zone. */
export function localDateKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/** A valid IANA zone, else UTC (the zone comes from the admin's browser). */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export function summarizeActivity(
  rows: AnalyticsRow[],
  nowDate: Date,
  resolve: (row: AnalyticsRow) => ActivityTarget | null,
  timeZone = 'UTC'
): FanActivity {
  const days: string[] = [];
  // Step back in 12h increments so DST changes never skip or repeat a calendar day.
  for (let t = nowDate.getTime(); days.length < 7; t -= DAY_MS / 2) {
    const key = localDateKey(new Date(t), timeZone);
    if (!days.includes(key)) days.unshift(key);
  }
  const daily = new Map(days.map((d) => [d, 0]));
  const byCategory: Record<ActivityCategory, number> = { events: 0, collections: 0, products: 0 };
  const counts = new Map<string, ActivityTarget & { category: ActivityCategory; count: number }>();
  let total = 0;
  let demoClicks = 0;
  for (const row of rows) {
    const category = EVENT_CATEGORY[row.event_name];
    const day = localDateKey(new Date(row.created_at), timeZone);
    if (!category || !daily.has(day)) continue;
    const target = resolve(row);
    if (target?.demo) {
      demoClicks++;
      continue;
    }
    total++;
    byCategory[category]++;
    daily.set(day, (daily.get(day) ?? 0) + 1);
    if (!target) continue;
    const prev = counts.get(target.key);
    counts.set(target.key, { ...target, category, count: (prev?.count ?? 0) + 1 });
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 3);
  return { total, demoClicks, byCategory, daily: days.map((date) => ({ date, count: daily.get(date) ?? 0 })), top, timeZone };
}

// ---------------------------------------------------------------------------------------------
// Demonstration content

/** Splits rows into real and demonstration records using an exact-id predicate. */
export function splitDemo<T extends { id: string }>(rows: T[], isDemoRow: (id: string) => boolean): { real: T[]; demo: T[] } {
  const real: T[] = [];
  const demo: T[] = [];
  for (const r of rows) (isDemoRow(r.id) ? demo : real).push(r);
  return { real, demo };
}

// ---------------------------------------------------------------------------------------------
// Storage meter (file storage only; bandwidth is a separate quota and is not shown)

export interface StorageSummary {
  usedBytes: number;
  quotaBytes: number;
  availableBytes: number;
  percent: number;
  level: 'ok' | 'warning' | 'critical';
  files: number;
  measuredAt: string;
  planLabel: string;
  /** false when the plan is assumed rather than configured. */
  planConfigured: boolean;
}

export function summarizeStorage(
  usedBytes: number,
  files: number,
  measuredAt: string,
  plan: { label: string; storageBytes: number; configured: boolean }
): StorageSummary {
  const quotaBytes = plan.storageBytes;
  const percent = Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10);
  return {
    usedBytes,
    quotaBytes,
    availableBytes: Math.max(0, quotaBytes - usedBytes),
    percent,
    level: percent >= 90 ? 'critical' : percent >= 75 ? 'warning' : 'ok',
    files,
    measuredAt,
    planLabel: plan.label,
    planConfigured: plan.configured,
  };
}

// ---------------------------------------------------------------------------------------------
// Endpoint response

export interface OverviewMedia {
  id: string;
  name: string | null;
  kind: 'image' | 'video' | 'other';
  /** Null when the original is too large to preview cheaply, or not an image. */
  preview_url: string | null;
  size_bytes: number | null;
  usage_type: string | null;
  created_at: string;
}

export interface ContentCount {
  key: 'events' | 'collections' | 'products' | 'releases';
  label: string;
  href: string;
  /** Real content only. */
  published: number;
  drafts: number;
  /** Demonstration records of this type (any status). */
  demo: number;
  /** Demonstration records that are publicly visible. */
  demoPublished: number;
}

export interface AdminOverview {
  generatedAt: string;
  /** Real content only; demonstration records never raise reminders. */
  attention: AttentionItem[];
  /** Proactive suggestions (merch/events first). Real content only; capped. */
  missions: MissionItem[];
  /** Next real events; demonstration events are counted in `upcomingDemoHidden`. */
  upcoming: OverviewEvent[];
  upcomingDemoHidden: number;
  recentMedia: OverviewMedia[];
  mediaTotals: { total: number; images: number; videos: number };
  content: ContentCount[];
  inbox: { recent: OverviewInquiry[]; newCount: number };
  activity: FanActivity;
  /** Null when usage could not be measured. */
  storage: StorageSummary | null;
  /** Plan-specific bandwidth note, or null (never a live figure). */
  bandwidthNotice: string | null;
}
