import { describe, expect, it } from 'vitest';
import {
  buildAttention,
  splitDemo,
  summarizeActivity,
  summarizeStorage,
  visibleAttention,
  type AttentionInput,
  type OverviewEvent,
} from './overview';
import { isDemo } from './demoContent';
import { bandwidthNotice, supabasePlan } from './supabasePlan';

const NOW = new Date('2026-10-27T12:00:00Z');
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 86_400_000).toISOString();

const event = (over: Partial<OverviewEvent> = {}): OverviewEvent => ({
  id: 'e1',
  title: 'Sunset Session',
  city: 'Tulum',
  venue: 'Beach',
  date: daysFromNow(5),
  status: 'published',
  booking_status: 'announced',
  ticket_url: null,
  artwork_url: 'https://example.com/a.jpg',
  updated_at: daysFromNow(-1),
  ...over,
});

const empty = (over: Partial<AttentionInput> = {}): AttentionInput => ({
  events: [],
  collections: [],
  products: [],
  releases: [],
  inquiries: [],
  policies: [],
  heroSlots: [],
  ...over,
});

describe('upcoming events', () => {
  it('does not flag a free or announced event just because it has no ticket link', () => {
    expect(buildAttention(empty({ events: [event({ booking_status: 'announced', ticket_url: null })] }), NOW)).toEqual([]);
  });

  it('flags an on-sale event with no ticket link as urgent when it is within 14 days', () => {
    const [item] = buildAttention(empty({ events: [event({ booking_status: 'on_sale' })] }), NOW);
    expect(item.severity).toBe('urgent');
    expect(item.title).toContain('a ticket link');
    expect(item.href).toBe('/admin/events?edit=e1');
    expect(item.snoozable).toBe(false);
  });

  it('flags a live event without a photo, important (snoozable) when it is further out', () => {
    const [item] = buildAttention(empty({ events: [event({ artwork_url: null, date: daysFromNow(20) })] }), NOW);
    expect(item.severity).toBe('important');
    expect(item.title).toContain('a photo');
    expect(item.snoozable).toBe(true);
  });

  it('ignores past, far-future and cancelled events', () => {
    const items = buildAttention(
      empty({
        events: [
          event({ id: 'past', artwork_url: null, date: daysFromNow(-2) }),
          event({ id: 'far', artwork_url: null, date: daysFromNow(60) }),
          event({ id: 'off', artwork_url: null, booking_status: 'cancelled' }),
        ],
      }),
      NOW
    );
    expect(items).toEqual([]);
  });

  it('reminds about a draft event happening soon, without also listing it as a stale draft', () => {
    const items = buildAttention(empty({ events: [event({ status: 'draft', updated_at: daysFromNow(-30) })] }), NOW);
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain("isn't published yet");
  });
});

describe('booking inquiries', () => {
  const inquiry = (id: string, ageDays: number, status = 'new') => ({
    id,
    name: `Guest ${id}`,
    event_name: null,
    status,
    created_at: daysFromNow(-ageDays),
  });

  it('flags only New inquiries older than two days, and is not snoozable', () => {
    const items = buildAttention(empty({ inquiries: [inquiry('a', 3), inquiry('b', 1), inquiry('c', 9, 'contacted')] }), NOW);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('inquiry:a');
    expect(items[0].href).toBe('/admin/booking-inquiries?status=new#inquiry-a');
    expect(items[0].snoozable).toBe(false);
  });

  it('groups several waiting inquiries into one item', () => {
    const items = buildAttention(empty({ inquiries: [inquiry('a', 3), inquiry('b', 5)] }), NOW);
    expect(items).toHaveLength(1);
    expect(items[0].title).toMatch(/^2 booking inquiries/);
    expect(items[0].detail).toContain('5 days');
  });
});

describe('products, legal pages and hero posters', () => {
  it('flags only published products missing a photo or price', () => {
    const items = buildAttention(
      empty({
        products: [
          { id: 'p1', name: 'Tee', status: 'published', updated_at: daysFromNow(-1), price_cents: 0, image_count: 0 },
          { id: 'p2', name: 'Cap', status: 'draft', updated_at: daysFromNow(-1), price_cents: 0, image_count: 0 },
        ],
        policies: [
          { slug: 'privacy', title: 'Privacy', status: 'published' },
          { slug: 'terms', title: 'Terms', status: 'published' },
          { slug: 'refund', title: 'Refund', status: 'published' },
          { slug: 'shipping', title: 'Shipping', status: 'published' },
        ],
      }),
      NOW
    );
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('“Tee” is in the Shop without a photo and a price');
    expect(items[0].href).toBe('/admin/shop?edit=p1');
  });

  it('only asks for refund and shipping pages once the shop has a live product', () => {
    const policies = [
      { slug: 'privacy', title: 'Privacy', status: 'published' },
      { slug: 'terms', title: 'Terms', status: 'published' },
      { slug: 'refund', title: 'Refund policy', status: 'draft' },
      { slug: 'shipping', title: 'Shipping', status: 'draft' },
    ];
    expect(buildAttention(empty({ policies }), NOW)).toEqual([]);
    const live = buildAttention(
      empty({ policies, products: [{ id: 'p', name: 'Tee', status: 'published', updated_at: null, price_cents: 700, image_count: 1 }] }),
      NOW
    );
    expect(live).toHaveLength(1);
    expect(live[0].title).toBe('Refund and Shipping are not published yet');
    expect(live[0].detail).toBe('Refund and Shipping are linked from every page footer and the Shop. Until they are published, visitors see a “being finalised” notice.');
  });

  it('groups hero slots without posters per page', () => {
    const [item] = buildAttention(
      empty({
        heroSlots: [
          { page_slug: 'home', slot_index: 1, missing_poster: true },
          { page_slug: 'home', slot_index: 3, missing_poster: true },
          { page_slug: 'home', slot_index: 2, missing_poster: false },
        ],
      }),
      NOW
    );
    expect(item.title).toBe('2 homepage videos have no poster image');
    expect(item.severity).toBe('reminder');
  });
});

describe('stale drafts and ordering', () => {
  it('groups stale drafts per type and links a single one straight to its editor', () => {
    const items = buildAttention(
      empty({
        collections: [{ id: 'g1', name: 'Tulum', status: 'draft', updated_at: daysFromNow(-10) }],
        releases: [
          { id: 'r1', name: 'One', status: 'draft', updated_at: daysFromNow(-8) },
          { id: 'r2', name: 'Two', status: 'draft', updated_at: daysFromNow(-20) },
          { id: 'r3', name: 'Fresh', status: 'draft', updated_at: daysFromNow(-1) },
        ],
      }),
      NOW
    );
    expect(items.map((i) => i.title)).toEqual(['“Tulum” is still a draft', '2 release drafts are waiting']);
    expect(items[0].href).toBe('/admin/collections?edit=g1');
    expect(items[1].detail).toContain('20 days');
  });

  it('orders urgent before important before reminders', () => {
    const items = buildAttention(
      empty({
        collections: [{ id: 'g1', name: 'Old', status: 'draft', updated_at: daysFromNow(-10) }],
        policies: [{ slug: 'privacy', title: 'Privacy', status: 'draft' }],
        inquiries: [{ id: 'i', name: 'A', event_name: null, status: 'new', created_at: daysFromNow(-3) }],
      }),
      NOW
    );
    expect(items.map((i) => i.severity)).toEqual(['urgent', 'important', 'reminder']);
  });

  it('hides snoozed items until the snooze ends, but never hides urgent ones', () => {
    const items = buildAttention(
      empty({
        collections: [{ id: 'g1', name: 'Old', status: 'draft', updated_at: daysFromNow(-10) }],
        inquiries: [{ id: 'i', name: 'A', event_name: null, status: 'new', created_at: daysFromNow(-3) }],
      }),
      NOW
    );
    const snoozes = { 'drafts:collections:g1': daysFromNow(3), 'inquiry:i': daysFromNow(3) };
    const { visible, snoozed } = visibleAttention(items, snoozes, NOW);
    expect(visible.map((i) => i.id)).toEqual(['inquiry:i']);
    expect(snoozed).toBe(1);
    expect(visibleAttention(items, { 'drafts:collections:g1': daysFromNow(-1) }, NOW).visible).toHaveLength(2);
  });
});

describe('fan activity', () => {
  it('counts the last seven UTC days by category and ranks the top content', () => {
    const rows = [
      { event_name: 'event_card_click', entity_type: 'event', entity_id: 'e1', created_at: '2026-10-27T09:00:00Z' },
      { event_name: 'event_card_click', entity_type: 'event', entity_id: 'e1', created_at: '2026-10-25T09:00:00Z' },
      { event_name: 'product_click', entity_type: 'product', entity_id: 'p1', created_at: '2026-10-21T09:00:00Z' },
      { event_name: 'add_to_cart', entity_type: 'product', entity_id: 'p1', created_at: '2026-10-26T09:00:00Z' },
      { event_name: 'gallery_click', entity_type: 'gallery', entity_id: 'g1', created_at: '2026-10-20T09:00:00Z' },
      { event_name: 'page_view', entity_type: null, entity_id: null, created_at: '2026-10-27T09:00:00Z' },
    ];
    const a = summarizeActivity(rows, NOW, (r) => (r.entity_id ? { key: r.entity_id, label: r.entity_id.toUpperCase(), href: '#' } : null));
    expect(a.total).toBe(4);
    expect(a.byCategory).toEqual({ events: 2, collections: 0, products: 2 });
    expect(a.daily.map((d) => d.date)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
    expect(a.daily.map((d) => d.count)).toEqual([1, 0, 0, 0, 1, 1, 1]);
    expect(a.top.map((t) => [t.key, t.count])).toEqual([
      ['e1', 2],
      ['p1', 2],
    ]);
  });

  it('buckets by the admin’s own calendar day', () => {
    // 2026-10-27 03:30 UTC is still Monday Oct 26 in Los Angeles.
    const lateMonday = new Date('2026-10-27T03:30:00Z');
    const rows = [{ event_name: 'event_card_click', entity_type: 'event', entity_id: 'e1', created_at: '2026-10-27T02:00:00Z' }];
    const la = summarizeActivity(rows, lateMonday, () => null, 'America/Los_Angeles');
    expect(la.daily[6]).toEqual({ date: '2026-10-26', count: 1 });
    expect(la.daily).toHaveLength(7);
    expect(summarizeActivity(rows, lateMonday, () => null, 'UTC').daily[6]).toEqual({ date: '2026-10-27', count: 1 });
  });
});

describe('storage meter', () => {
  const gb = 1024 ** 3;
  const free = supabasePlan(undefined);

  it('reports usage against the plan quota with warning levels', () => {
    expect(summarizeStorage(0.37 * gb, 63, 'x', free)).toMatchObject({ percent: 37, level: 'ok', planLabel: 'Free', planConfigured: false });
    expect(summarizeStorage(0.8 * gb, 1, 'x', free).level).toBe('warning');
    expect(summarizeStorage(0.95 * gb, 1, 'x', free)).toMatchObject({ level: 'critical' });
    expect(summarizeStorage(2 * gb, 1, 'x', free)).toMatchObject({ percent: 100, availableBytes: 0 });
  });

  it('uses the configured plan, and flags an assumed one', () => {
    expect(supabasePlan('pro')).toMatchObject({ key: 'pro', storageBytes: 100 * gb, configured: true });
    expect(supabasePlan(' FREE ')).toMatchObject({ key: 'free', configured: true });
    expect(supabasePlan('team')).toMatchObject({ key: 'free', configured: false });
    expect(summarizeStorage(0.37 * gb, 63, 'x', supabasePlan('pro')).percent).toBe(0.4);
  });

  it('shows the bandwidth notice only on Free and only until the billing cycle ends', () => {
    expect(bandwidthNotice(supabasePlan('free'), new Date('2026-10-27T12:00:00Z'))).toMatch(/Nov 14/);
    expect(bandwidthNotice(supabasePlan('free'), new Date('2026-11-16T00:00:00Z'))).toBeNull();
    expect(bandwidthNotice(supabasePlan('pro'), new Date('2026-10-27T12:00:00Z'))).toBeNull();
  });
});

describe('demonstration content', () => {
  it('matches demo records by exact id only, never by title', () => {
    expect(isDemo('collections', 'd77dc441-678a-4b59-b566-4aadce501db5')).toBe(true);
    expect(isDemo('collections', 'some-real-collection')).toBe(false);
    const rows = [
      { id: '99d1c43e-4d1c-4db7-b19c-649e44bfc19e', name: 'TEST TEST' },
      { id: 'real-1', name: 'test' },
    ];
    const { real, demo } = splitDemo(rows, (id) => isDemo('events', id));
    expect(real.map((r) => r.id)).toEqual(['real-1']);
    expect(demo).toHaveLength(1);
  });

  it('keeps demo clicks out of totals and rankings but reports them separately', () => {
    const rows = [
      { event_name: 'gallery_click', entity_type: 'gallery', entity_id: 'demo', created_at: '2026-10-27T09:00:00Z' },
      { event_name: 'gallery_click', entity_type: 'gallery', entity_id: 'demo', created_at: '2026-10-27T09:00:00Z' },
      { event_name: 'event_card_click', entity_type: 'event', entity_id: 'real', created_at: '2026-10-27T09:00:00Z' },
    ];
    const a = summarizeActivity(rows, NOW, (r) => ({ key: r.entity_id!, label: r.entity_id!, href: '#', demo: r.entity_id === 'demo' }));
    expect(a.total).toBe(1);
    expect(a.demoClicks).toBe(2);
    expect(a.byCategory).toEqual({ events: 1, collections: 0, products: 0 });
    expect(a.top.map((t) => t.key)).toEqual(['real']);
  });

  it('still asks for refund and shipping pages while a demo product is publicly visible', () => {
    const items = buildAttention(
      empty({
        products: [],
        shopIsLive: true,
        policies: [
          { slug: 'privacy', title: 'Privacy', status: 'published' },
          { slug: 'terms', title: 'Terms', status: 'published' },
          { slug: 'refund', title: 'Refund', status: 'draft' },
        ],
      }),
      NOW
    );
    expect(items.map((i) => i.title)).toEqual(['Refund is not published yet']);
  });
});
