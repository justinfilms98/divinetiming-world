import { NextResponse, type NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { getServiceClient } from '@/lib/supabase/service';
import { resolveHeroSlotVideoUrl } from '@/lib/storageUrls';
import { heroRenditionFor } from '@/lib/media/heroRenditions';
import { isDemo } from '@/lib/admin/demoContent';
import { bandwidthNotice, supabasePlan } from '@/lib/admin/supabasePlan';
import {
  buildAttention,
  eventLabel,
  PREVIEW_MAX_BYTES,
  safeTimeZone,
  splitDemo,
  summarizeActivity,
  summarizeStorage,
  type ActivityTarget,
  type AdminOverview,
  type AnalyticsRow,
  type ContentCount,
  type OverviewDraftable,
  type OverviewEvent,
  type OverviewHeroSlot,
  type OverviewMedia,
  type OverviewProduct,
} from '@/lib/admin/overview';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

type StorageClient = ReturnType<typeof getServiceClient>;

async function folderUsage(client: StorageClient, bucket: string, prefix: string): Promise<{ bytes: number; files: number }> {
  let bytes = 0;
  let files = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const entry of data ?? []) {
      // Folders come back without an id.
      if (entry.id === null) {
        const sub = await folderUsage(client, bucket, prefix ? `${prefix}/${entry.name}` : entry.name);
        bytes += sub.bytes;
        files += sub.files;
      } else {
        bytes += Number((entry.metadata as { size?: number } | null)?.size ?? 0);
        files += 1;
      }
    }
    if (!data || data.length < 1000) break;
  }
  return { bytes, files };
}

/**
 * Total stored bytes across all buckets. Walking storage takes a handful of requests, so the
 * result is cached for 15 minutes rather than recomputed on every dashboard visit.
 */
const getStorageUsage = unstable_cache(
  async () => {
    const client = getServiceClient();
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) throw error;
    let bytes = 0;
    let files = 0;
    for (const b of buckets ?? []) {
      const usage = await folderUsage(client, b.id, '');
      bytes += usage.bytes;
      files += usage.files;
    }
    return { bytes, files, measuredAt: new Date().toISOString() };
  },
  ['admin-storage-usage'],
  { revalidate: 900 }
);

type EventRow = {
  id: string;
  title: string | null;
  city: string | null;
  venue: string | null;
  date: string;
  status: string | null;
  booking_status: string | null;
  ticket_url: string | null;
  thumbnail_url: string | null;
  external_thumbnail_asset_id: string | null;
  updated_at: string | null;
};

type AssetRow = {
  id: string;
  name: string | null;
  mime_type: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  size_bytes: number | null;
  usage_type: string | null;
  is_archived: boolean | null;
  created_at: string;
};

type HeroSlotJson = {
  enabled?: boolean;
  media_type?: string;
  slot_index?: number;
  video_url?: string | null;
  video_storage_path?: string | null;
  poster_storage_path?: string | null;
};

const isImage = (mime: string | null) => (mime ?? '').toLowerCase().startsWith('image/');
const isVideo = (mime: string | null) => (mime ?? '').toLowerCase().startsWith('video/');

/** Read-only summary for the admin dashboard home. Never writes. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const now = new Date();
  const timeZone = safeTimeZone(request.nextUrl.searchParams.get('tz'));
  // Seven local calendar days can start up to a day earlier than "now minus 7×24h".
  const weekAgo = new Date(now.getTime() - 8 * DAY_MS).toISOString();

  const [eventsRes, galleriesRes, productsRes, releasesRes, inquiriesRes, policiesRes, heroRes, assetsRes, analyticsRes, storageRes] =
    await Promise.all([
      supabase
        .from('events')
        .select('id, title, city, venue, date, status, booking_status, ticket_url, thumbnail_url, external_thumbnail_asset_id, updated_at')
        .order('date', { ascending: true })
        .limit(500),
      supabase.from('galleries').select('id, name, status, updated_at').limit(500),
      supabase.from('products').select('id, name, status, updated_at, price_cents, thumbnail_url, product_images(id)').limit(500),
      supabase.from('releases').select('id, title, status, updated_at').limit(500),
      supabase.from('booking_inquiries').select('id, name, event_name, status, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('legal_policies').select('slug, title, status'),
      supabase.from('hero_sections').select('page_slug, hero_slots'),
      supabase
        .from('external_media_assets')
        .select('id, name, mime_type, preview_url, thumbnail_url, size_bytes, usage_type, is_archived, created_at')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase.from('analytics_events').select('event_name, entity_type, entity_id, created_at').gte('created_at', weekAgo).limit(5000),
      getStorageUsage().then(
        (v) => v,
        () => null
      ),
    ]);

  const failed = [eventsRes, galleriesRes, productsRes, releasesRes, inquiriesRes, policiesRes, heroRes, assetsRes, analyticsRes].find(
    (r) => r.error
  );
  if (failed) {
    console.error('Admin overview query failed:', failed.error);
    return NextResponse.json({ ok: false, error: 'Could not load the dashboard.' }, { status: 500 });
  }

  const assets = (assetsRes.data ?? []) as AssetRow[];
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const sizeByUrl = new Map<string, number>();
  for (const a of assets) {
    if (a.size_bytes == null) continue;
    if (a.preview_url) sizeByUrl.set(a.preview_url, a.size_bytes);
    if (a.thumbnail_url) sizeByUrl.set(a.thumbnail_url, a.size_bytes);
  }

  const events: OverviewEvent[] = ((eventsRes.data ?? []) as EventRow[]).map((e) => {
    const asset = e.external_thumbnail_asset_id ? assetById.get(e.external_thumbnail_asset_id) : undefined;
    const url = e.thumbnail_url?.trim().startsWith('https://') ? e.thumbnail_url.trim() : asset?.thumbnail_url || asset?.preview_url || null;
    const size = url ? sizeByUrl.get(url) ?? asset?.size_bytes ?? null : null;
    const tooLarge = size != null && size > PREVIEW_MAX_BYTES;
    return {
      id: e.id,
      title: e.title,
      city: e.city,
      venue: e.venue,
      date: e.date,
      status: e.status,
      booking_status: e.booking_status,
      ticket_url: e.ticket_url,
      artwork_url: url,
      artwork_too_large: tooLarge,
      updated_at: e.updated_at,
    };
  });

  const collections: OverviewDraftable[] = ((galleriesRes.data ?? []) as { id: string; name: string | null; status: string | null; updated_at: string | null }[]).map(
    (g) => ({ id: g.id, name: g.name?.trim() || 'Untitled collection', status: g.status, updated_at: g.updated_at })
  );
  const products: OverviewProduct[] = (
    (productsRes.data ?? []) as {
      id: string;
      name: string | null;
      status: string | null;
      updated_at: string | null;
      price_cents: number | null;
      thumbnail_url: string | null;
      product_images: { id: string }[] | null;
    }[]
  ).map((p) => ({
    id: p.id,
    name: p.name?.trim() || 'Untitled product',
    status: p.status,
    updated_at: p.updated_at,
    price_cents: p.price_cents,
    image_count: (p.product_images?.length ?? 0) + (p.thumbnail_url ? 1 : 0),
  }));
  const releases: OverviewDraftable[] = ((releasesRes.data ?? []) as { id: string; title: string | null; status: string | null; updated_at: string | null }[]).map(
    (r) => ({ id: r.id, name: r.title?.trim() || 'Untitled release', status: r.status, updated_at: r.updated_at })
  );
  const inquiries = (inquiriesRes.data ?? []) as { id: string; name: string | null; event_name: string | null; status: string | null; created_at: string }[];

  const heroSlots: OverviewHeroSlot[] = [];
  for (const row of (heroRes.data ?? []) as { page_slug: string; hero_slots: HeroSlotJson[] | null }[]) {
    for (const slot of Array.isArray(row.hero_slots) ? row.hero_slots : []) {
      if (slot.enabled === false || slot.media_type !== 'video') continue;
      const videoUrl = slot.video_url || resolveHeroSlotVideoUrl(slot.video_storage_path);
      // The homepage clips play web renditions that carry their own first-frame posters.
      const missing = !slot.poster_storage_path && !heroRenditionFor(videoUrl)?.poster;
      heroSlots.push({ page_slug: row.page_slug, slot_index: slot.slot_index ?? 0, missing_poster: missing });
    }
  }

  // Demonstration records stay in the admin but never raise reminders or fill "Coming up".
  const ev = splitDemo(events, (id) => isDemo('events', id));
  const col = splitDemo(collections, (id) => isDemo('collections', id));
  const prod = splitDemo(products, (id) => isDemo('products', id));
  const rel = splitDemo(releases, (id) => isDemo('releases', id));

  const attention = buildAttention(
    {
      events: ev.real,
      collections: col.real,
      products: prod.real,
      releases: rel.real,
      inquiries,
      policies: (policiesRes.data ?? []) as { slug: string; title: string | null; status: string | null }[],
      heroSlots,
      // A published demo product is still visible in the Shop, so the refund and shipping pages matter.
      shopIsLive: products.some((p) => p.status === 'published'),
    },
    now
  );

  const isUpcoming = (e: OverviewEvent) => Date.parse(e.date) >= now.getTime() && e.booking_status !== 'cancelled';
  const upcoming = ev.real.filter(isUpcoming).slice(0, 3);
  const upcomingDemoHidden = ev.demo.filter(isUpcoming).length;

  const liveAssets = assets.filter((a) => !a.is_archived);
  const recentMedia: OverviewMedia[] = liveAssets.slice(0, 6).map((a) => {
    const kind = isImage(a.mime_type) ? 'image' : isVideo(a.mime_type) ? 'video' : 'other';
    const previewable = kind === 'image' && (a.size_bytes == null || a.size_bytes <= PREVIEW_MAX_BYTES);
    return {
      id: a.id,
      name: a.name,
      kind,
      preview_url: previewable ? a.thumbnail_url || a.preview_url : null,
      size_bytes: a.size_bytes,
      usage_type: a.usage_type,
      created_at: a.created_at,
    };
  });

  const count = (split: { real: { status: string | null }[]; demo: { status: string | null }[] }) => ({
    published: split.real.filter((r) => r.status === 'published').length,
    drafts: split.real.filter((r) => r.status === 'draft').length,
    demo: split.demo.length,
    demoPublished: split.demo.filter((r) => r.status === 'published').length,
  });
  const content: ContentCount[] = [
    { key: 'events', label: 'Events', href: '/admin/events', ...count(ev) },
    { key: 'collections', label: 'Collections', href: '/admin/collections', ...count(col) },
    { key: 'releases', label: 'Music', href: '/admin/releases', ...count(rel) },
    { key: 'products', label: 'Shop', href: '/admin/shop', ...count(prod) },
  ];

  // Fan activity: name the content behind each recorded interaction.
  const rows = (analyticsRes.data ?? []) as AnalyticsRow[];
  const mediaIds = [...new Set(rows.filter((r) => r.entity_type === 'gallery_media' && r.entity_id).map((r) => r.entity_id!))];
  const galleryOfMedia = new Map<string, string>();
  if (mediaIds.length > 0) {
    const { data } = await supabase.from('gallery_media').select('id, gallery_id').in('id', mediaIds);
    for (const m of (data ?? []) as { id: string; gallery_id: string }[]) galleryOfMedia.set(m.id, m.gallery_id);
  }
  const eventById = new Map(events.map((e) => [e.id, e]));
  const collectionById = new Map(collections.map((c) => [c.id, c]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const resolve = (row: AnalyticsRow): ActivityTarget | null => {
    const id = row.entity_id;
    if (!id) return null;
    if (row.entity_type === 'event') {
      const e = eventById.get(id);
      return e ? { key: `event:${id}`, label: eventLabel(e), href: `/admin/events?edit=${id}`, demo: isDemo('events', id) } : null;
    }
    const galleryId = row.entity_type === 'gallery' ? id : row.entity_type === 'gallery_media' ? galleryOfMedia.get(id) : undefined;
    if (galleryId) {
      const g = collectionById.get(galleryId);
      return g
        ? { key: `gallery:${galleryId}`, label: g.name, href: `/admin/collections?edit=${galleryId}`, demo: isDemo('collections', galleryId) }
        : null;
    }
    if (row.entity_type === 'product') {
      const p = productById.get(id);
      return p ? { key: `product:${id}`, label: p.name, href: `/admin/shop?edit=${id}`, demo: isDemo('products', id) } : null;
    }
    return null;
  };

  const plan = supabasePlan();
  const overview: AdminOverview = {
    generatedAt: now.toISOString(),
    attention,
    upcoming,
    upcomingDemoHidden,
    recentMedia,
    mediaTotals: {
      total: liveAssets.length,
      images: liveAssets.filter((a) => isImage(a.mime_type)).length,
      videos: liveAssets.filter((a) => isVideo(a.mime_type)).length,
    },
    content,
    inbox: {
      recent: inquiries.slice(0, 3),
      newCount: inquiries.filter((i) => (i.status ?? 'new') === 'new').length,
    },
    activity: summarizeActivity(rows, now, resolve, timeZone),
    storage: storageRes ? summarizeStorage(storageRes.bytes, storageRes.files, storageRes.measuredAt, plan) : null,
    bandwidthNotice: bandwidthNotice(plan, now),
  };

  return NextResponse.json({ ok: true, data: overview }, { headers: { 'Cache-Control': 'no-store' } });
}
