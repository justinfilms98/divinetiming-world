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
}

export interface OverviewDraftable {
  id: string;
  name: string;
  status: string | null;
  updated_at: string | null;
}

export interface OverviewProduct extends OverviewDraftable {
  price_cents: number | null;
  image_count: number;
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
}

const DAY_MS = 86_400_000;
export const STALE_DRAFT_DAYS = 7;
export const INQUIRY_REPLY_DAYS = 2;
export const UPCOMING_WINDOW_DAYS = 30;
export const URGENT_EVENT_DAYS = 14;
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
  const shopIsLive = input.products.some((p) => p.status === 'published');
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
}

export interface FanActivity {
  total: number;
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
  for (const row of rows) {
    const category = EVENT_CATEGORY[row.event_name];
    const day = localDateKey(new Date(row.created_at), timeZone);
    if (!category || !daily.has(day)) continue;
    total++;
    byCategory[category]++;
    daily.set(day, (daily.get(day) ?? 0) + 1);
    const target = resolve(row);
    if (!target) continue;
    const prev = counts.get(target.key);
    counts.set(target.key, { ...target, category, count: (prev?.count ?? 0) + 1 });
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 3);
  return { total, byCategory, daily: days.map((date) => ({ date, count: daily.get(date) ?? 0 })), top, timeZone };
}

// ---------------------------------------------------------------------------------------------
// Storage meter

/** Supabase Free plan file storage. Bandwidth is a separate quota and is not shown here. */
export const STORAGE_QUOTA_BYTES = 1024 ** 3;

export interface StorageSummary {
  usedBytes: number;
  quotaBytes: number;
  availableBytes: number;
  percent: number;
  level: 'ok' | 'warning' | 'critical';
  files: number;
  measuredAt: string;
}

export function summarizeStorage(usedBytes: number, files: number, measuredAt: string, quotaBytes = STORAGE_QUOTA_BYTES): StorageSummary {
  const percent = Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10);
  return {
    usedBytes,
    quotaBytes,
    availableBytes: Math.max(0, quotaBytes - usedBytes),
    percent,
    level: percent >= 90 ? 'critical' : percent >= 75 ? 'warning' : 'ok',
    files,
    measuredAt,
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
  published: number;
  drafts: number;
}

export interface AdminOverview {
  generatedAt: string;
  attention: AttentionItem[];
  upcoming: OverviewEvent[];
  recentMedia: OverviewMedia[];
  mediaTotals: { total: number; images: number; videos: number };
  content: ContentCount[];
  inbox: { recent: OverviewInquiry[]; newCount: number };
  activity: FanActivity;
  /** Null when usage could not be measured. */
  storage: StorageSummary | null;
}
