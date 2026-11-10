'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarPlus,
  Clapperboard,
  Disc3,
  Film,
  FolderPlus,
  HardDrive,
  ImageIcon,
  Inbox,
  Info,
  MousePointerClick,
  ShoppingBag,
  UploadCloud,
} from 'lucide-react';
import { isOptimizableImageUrl } from '@/lib/media/imageHosts';
import { eventLabel, type AdminOverview, type ContentCount, type OverviewEvent, type StorageSummary } from '@/lib/admin/overview';

const CARD = 'rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5';
const HEADING = 'text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A75E]/85';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${Number((bytes / 1024 ** 3).toFixed(2))} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function CardHeader({ id, title, href, linkLabel }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className={HEADING}>
        {title}
      </h2>
      {href && (
        <Link href={href} className="-my-2 inline-flex min-h-11 items-center px-1 text-sm text-white/60 hover:text-white">
          {linkLabel ?? 'View all'}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

const PRIMARY_ACTIONS: { label: string; hint: string; href: string; icon: LucideIcon }[] = [
  { label: 'Upload media', hint: 'Photos & videos', href: '/admin/media', icon: UploadCloud },
  { label: 'Add event', hint: 'Show or tour date', href: '/admin/events?new=1', icon: CalendarPlus },
  { label: 'New collection', hint: 'Photo story', href: '/admin/collections?new=1', icon: FolderPlus },
  { label: 'Edit homepage', hint: 'Hero videos & copy', href: '/admin/hero', icon: Clapperboard },
];

const SECONDARY_ACTIONS = [
  { label: 'New release', href: '/admin/releases?new=1', icon: Disc3 },
  { label: 'New product', href: '/admin/shop?new=1', icon: ShoppingBag },
];

export function QuickActions() {
  return (
    <section aria-labelledby="create-heading" className="space-y-3">
      <h2 id="create-heading" className={HEADING}>
        Create &amp; update
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map(({ label, hint, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[104px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-[#C6A75E]/45 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75E]/60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C6A75E]/15 text-[#C6A75E]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold text-white">{label}</span>
              <span className="block text-[13px] text-white/50">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SECONDARY_ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[15px] font-medium text-white/80 hover:border-[#C6A75E]/45 hover:text-white sm:flex-none"
          >
            <Icon className="h-4 w-4 text-[#C6A75E]" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

function StatusChip({ status }: { status: string | null }) {
  const live = status === 'published';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        live ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
      }`}
    >
      {live ? 'Published' : status === 'archived' ? 'Archived' : 'Draft'}
    </span>
  );
}

function Artwork({ url, tooLarge, alt, sizes }: { url: string | null; tooLarge?: boolean; alt: string; sizes: string }) {
  if (url && !tooLarge && isOptimizableImageUrl(url)) {
    return <Image src={url} alt={alt} fill sizes={sizes} quality={70} className="object-cover" />;
  }
  return (
    <span className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1410] to-[#0f0c10] text-[#C6A75E]/70">
      <ImageIcon className="h-5 w-5" aria-hidden />
      {tooLarge && (
        <span className="absolute inset-x-0 bottom-1 px-1 text-center text-xs leading-tight text-white/45" title="Preview skipped: the original file is very large">
          Large original
        </span>
      )}
    </span>
  );
}

const ticketLabel: Record<string, string> = { on_sale: 'Tickets on sale', sold_out: 'Sold out', announced: 'Announced' };

export function UpcomingEvents({ events, demoHidden }: { events: OverviewEvent[]; demoHidden: number }) {
  return (
    <section aria-labelledby="upcoming-heading" className={CARD}>
      <CardHeader id="upcoming-heading" title="Coming up" href="/admin/events" />
      {events.length === 0 ? (
        <div className="mt-3 space-y-3">
          <p className="text-[15px] leading-relaxed text-white/70">No upcoming performances yet.</p>
          <Link
            href="/admin/events?new=1"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#C6A75E]/40 px-4 text-[15px] font-medium text-[#C6A75E] hover:bg-[#C6A75E]/10"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Add an event
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {events.map((e) => {
            const d = new Date(e.date);
            return (
              <li key={e.id}>
                <Link href={`/admin/events?edit=${e.id}`} className="group flex items-center gap-3 rounded-xl p-1 -m-1 hover:bg-white/[0.03]">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black md:h-24 md:w-28">
                    <Artwork url={e.artwork_url} tooLarge={e.artwork_too_large} alt="" sizes="(max-width: 768px) 80px, 112px" />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-center text-xs font-semibold uppercase leading-tight tracking-wide text-[#E8D9B0] backdrop-blur">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                      <span className="block text-sm leading-none text-white">{d.getDate()}</span>
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-white">{eventLabel(e)}</span>
                    <span className="block truncate text-sm text-white/50">{[e.venue, e.city].filter(Boolean).join(' · ')}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusChip status={e.status} />
                      {e.booking_status && ticketLabel[e.booking_status] && (
                        <span className="text-[13px] text-white/55">{ticketLabel[e.booking_status]}</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {demoHidden > 0 && (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/45">
          {demoHidden} upcoming demo {demoHidden === 1 ? 'event is' : 'events are'} left out here. They stay in{' '}
          <Link href="/admin/events" className="text-white/70 underline-offset-2 hover:underline">
            Events
          </Link>{' '}
          with a Demo label.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

export function RecentUploads({ media, totals }: { media: AdminOverview['recentMedia']; totals: AdminOverview['mediaTotals'] }) {
  return (
    <section aria-labelledby="uploads-heading" className={CARD}>
      <CardHeader id="uploads-heading" title="Recent uploads" href="/admin/media" linkLabel="Media library" />
      <p className="mt-1 text-xs text-white/45">
        {totals.total} files · {totals.images} photos · {totals.videos} videos
      </p>
      {media.length === 0 ? (
        <p className="mt-4 text-sm text-white/55">
          Nothing uploaded yet.{' '}
          <Link href="/admin/media" className="font-medium text-[#C6A75E] hover:underline">
            Upload your first photo
          </Link>
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 md:gap-3">
          {media.map((m) => (
            <li key={m.id}>
              <Link href="/admin/media" className="group relative block aspect-square overflow-hidden rounded-xl border border-white/10 bg-black" title={m.name ?? undefined}>
                {m.preview_url ? (
                  <Artwork url={m.preview_url} alt={m.name ?? ''} sizes="(max-width: 640px) 30vw, 120px" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#1a1410] to-[#0f0c10] px-2 text-center text-[#C6A75E]/75">
                    {m.kind === 'video' ? <Film className="h-5 w-5" aria-hidden /> : <ImageIcon className="h-5 w-5" aria-hidden />}
                    <span className="line-clamp-2 text-xs leading-tight text-white/45">{m.name}</span>
                  </span>
                )}
                {m.usage_type && m.usage_type !== 'public' && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs capitalize text-white/70">{m.usage_type}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

export function ContentStatus({ content }: { content: ContentCount[] }) {
  return (
    <section aria-labelledby="live-heading" className={CARD}>
      <CardHeader id="live-heading" title="What's live" />
      <ul className="mt-2 divide-y divide-white/[0.06]">
        {content.map((c) => (
          <li key={c.key}>
            <Link href={c.href} className="flex min-h-[48px] items-center justify-between gap-3 py-2 hover:text-white">
              <span className="text-base text-white/85">{c.label}</span>
              <span className="flex flex-wrap items-center justify-end gap-x-2 text-sm">
                <span className="text-emerald-300">{c.published} live</span>
                {c.drafts > 0 && <span className="text-amber-300/90">{c.drafts} draft{c.drafts === 1 ? '' : 's'}</span>}
                {c.demo > 0 && (
                  <span className="text-white/50">
                    {c.demo} demo{c.demoPublished > 0 ? ` (${c.demoPublished === c.demo ? '' : `${c.demoPublished} `}public)` : ''}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {content.some((c) => c.demo > 0) && (
        <p className="mt-2 text-[13px] leading-relaxed text-white/45">
          Demo items are examples kept for reference. They aren&apos;t counted as live or draft work and don&apos;t raise reminders.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

export function InboxCard({ inbox }: { inbox: AdminOverview['inbox'] }) {
  return (
    <section aria-labelledby="inbox-heading" className={CARD}>
      <CardHeader id="inbox-heading" title="Booking inbox" href="/admin/booking-inquiries" />
      {inbox.recent.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-white/55">
          <Inbox className="h-5 w-5 shrink-0 text-white/30" aria-hidden />
          No booking inquiries yet. New ones from the Book page appear here.
        </div>
      ) : (
        <>
          {inbox.newCount > 0 && <p className="mt-1 text-sm text-[#C6A75E]">{inbox.newCount} new</p>}
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {inbox.recent.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/booking-inquiries#inquiry-${i.id}`} className="flex min-h-[52px] items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-base text-white/90">{i.name || 'Unnamed'}</span>
                    {i.event_name && <span className="block truncate text-sm text-white/45">{i.event_name}</span>}
                  </span>
                  <span className="shrink-0 text-right text-[13px] text-white/50">
                    <span className="block capitalize">{i.status ?? 'new'}</span>
                    {new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

const CATEGORY_LABEL = { events: 'Events', collections: 'Collections', products: 'Products' } as const;
const CATEGORY_SINGULAR = { events: 'Event', collections: 'Collection', products: 'Product' } as const;

export function FanActivityCard({ activity }: { activity: AdminOverview['activity'] }) {
  const max = Math.max(1, ...activity.daily.map((d) => d.count));
  return (
    <section aria-labelledby="activity-heading" className={CARD}>
      <CardHeader id="activity-heading" title="Fan activity · 7 days" />
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold tabular-nums text-white">{activity.total}</p>
          <p className="text-[13px] leading-snug text-white/55">
            recorded clicks
            <br />
            on real content
          </p>
        </div>
        <div className="flex h-14 flex-1 items-end gap-1.5" role="img" aria-label={`Daily recorded clicks: ${activity.daily.map((d) => d.count).join(', ')}`}>
          {activity.daily.map((d) => (
            <span key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`w-full rounded-sm ${d.count > 0 ? 'bg-[#C6A75E]/80' : 'bg-white/10'}`}
                style={{ height: `${Math.max(6, (d.count / max) * 44)}px` }}
              />
              <span className="text-xs text-white/35">{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
            </span>
          ))}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((k) => (
          <div key={k} className="rounded-xl bg-white/[0.04] py-2">
            <dt className="text-xs text-white/45">{CATEGORY_LABEL[k]}</dt>
            <dd className="text-base font-semibold tabular-nums text-white">{activity.byCategory[k]}</dd>
          </div>
        ))}
      </dl>
      {activity.top.length > 0 ? (
        <>
          <h3 className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-white/45">Most clicked</h3>
          <ol className="mt-1 space-y-1">
            {activity.top.map((t) => (
              <li key={t.key}>
                <Link href={t.href} className="flex min-h-[44px] items-center justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate">
                    <span className="text-white/85">{t.label}</span>
                    <span className="ml-2 text-xs text-white/45">{CATEGORY_SINGULAR[t.category]}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-white/55">{t.count}</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          No recorded clicks on real content this week. Once real events, collections and products are live, the most-clicked ones appear here.
        </p>
      )}
      {activity.demoClicks > 0 && (
        <p className="mt-3 text-[13px] text-white/45">
          {activity.demoClicks} {activity.demoClicks === 1 ? 'click' : 'clicks'} on demo content this week, not counted above.
        </p>
      )}
      <p className="mt-3 flex items-start gap-1.5 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/45">
        <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        These are recorded clicks, not unique visitors. The site can&apos;t yet tell your own visits apart from fans&apos;, so small numbers may
        include your testing.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

/** Bandwidth has no live figure here (Supabase reports it only in its own dashboard). */
export function StorageCard({ storage, bandwidthNotice }: { storage: StorageSummary | null; bandwidthNotice: string | null }) {
  const bar = storage?.level === 'critical' ? 'bg-rose-400' : storage?.level === 'warning' ? 'bg-amber-400' : 'bg-[#C6A75E]';
  return (
    <section aria-labelledby="storage-heading" className={CARD}>
      <CardHeader id="storage-heading" title="Storage" href="/admin/media" linkLabel="Manage media" />
      {!storage ? (
        <div className="mt-3 flex items-start gap-3 text-sm text-white/55">
          <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-white/30" aria-hidden />
          Storage usage couldn&apos;t be measured right now. It will show here once it can be read again.
        </div>
      ) : (
        <>
          <p className="mt-3 text-white">
            <span className="text-2xl font-semibold tabular-nums">{formatBytes(storage.usedBytes)}</span>
            <span className="text-sm text-white/50"> of {formatBytes(storage.quotaBytes)} used</span>
          </p>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={storage.percent}
            aria-label={`Storage ${storage.percent}% used`}
          >
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(2, storage.percent)}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/60">
            {storage.percent}% used · {formatBytes(storage.availableBytes)} available · {storage.files} files
          </p>
          {storage.level !== 'ok' && (
            <p className={`mt-2 text-sm ${storage.level === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
              {storage.level === 'critical'
                ? `Storage is almost full. New uploads will fail once it reaches ${formatBytes(storage.quotaBytes)}.`
                : 'Storage is getting full. Consider removing unused files or planning more space.'}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            {storage.planConfigured
              ? `Supabase ${storage.planLabel} plan limit`
              : `Limit assumes the Supabase ${storage.planLabel} plan (${formatBytes(storage.quotaBytes)}); update it if the plan changes`}
            {' · '}measured {new Date(storage.measuredAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}, refreshed every 15
            minutes
          </p>
        </>
      )}
      <p className="mt-3 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/50">
        <Info className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
        Storage is the files you keep. Bandwidth is what visitors download, and it isn&apos;t shown here: Supabase reports it in its own
        dashboard under Usage.
        {bandwidthNotice && <span className="mt-1.5 block text-amber-200/85">{bandwidthNotice}</span>}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.06] motion-safe:animate-pulse ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-5 xl:grid-cols-3 xl:gap-6">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="space-y-5 xl:col-span-2 xl:space-y-6">
        <div className={CARD}>
          <Block className="h-3 w-40" />
          <Block className="mt-4 h-12" />
          <Block className="mt-3 h-12" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
        <div className={CARD}>
          <Block className="h-3 w-24" />
          <div className="mt-3 flex gap-3">
            <Block className="h-20 w-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Block className="h-4 w-3/4" />
              <Block className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid content-start gap-5 lg:grid-cols-2 xl:grid-cols-1 xl:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={CARD}>
            <Block className="h-3 w-28" />
            <Block className="mt-4 h-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
