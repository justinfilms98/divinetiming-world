'use client';

import { useEffect, useState } from 'react';
import type { AdminOverview } from '@/lib/admin/overview';
import { AttentionPanel } from './AttentionPanel';
import {
  ContentStatus,
  DashboardSkeleton,
  FanActivityCard,
  InboxCard,
  QuickActions,
  RecentUploads,
  StorageCard,
  UpcomingEvents,
} from './DashboardSections';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: AdminOverview };

async function fetchOverview(): Promise<AdminOverview | null> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`/api/admin/overview?tz=${encodeURIComponent(tz)}`, { credentials: 'same-origin', cache: 'no-store' }).catch(
    () => null
  );
  if (!res?.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.ok ? (body.data as AdminOverview) : null;
}

function greeting(now: Date) {
  const h = now.getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function StudioIntro({ data }: { data: AdminOverview }) {
  const now = new Date(data.generatedAt);
  const live = data.content.reduce((n, c) => n + c.published, 0);
  const drafts = data.content.reduce((n, c) => n + c.drafts, 0);
  const next = data.upcoming.find((e) => e.status === 'published');
  const days = next ? Math.max(0, Math.ceil((Date.parse(next.date) - now.getTime()) / 86_400_000)) : null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <p className="text-2xl font-semibold text-white md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
        {greeting(now)}
      </p>
      <p className="text-sm leading-relaxed text-white/55">
        {live} live · {drafts} in draft
        {days != null ? ` · next show in ${days === 0 ? 'less than a day' : `${days} day${days === 1 ? '' : 's'}`}` : ''}
      </p>
    </div>
  );
}

export function DashboardHome() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchOverview().then((data) => {
      if (!cancelled) setState(data ? { status: 'ready', data } : { status: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    setState({ status: 'loading' });
    fetchOverview().then((data) => setState(data ? { status: 'ready', data } : { status: 'error' }));
  };

  if (state.status === 'loading') return <DashboardSkeleton />;
  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="font-medium text-white">The dashboard couldn&apos;t be loaded</p>
        <p className="mt-1 text-sm text-white/55">Your content is safe. Check your connection and try again.</p>
        <button type="button" onClick={retry} className="admin-btn-primary mt-4 min-h-11 rounded-full px-5 text-[15px]">
          Try again
        </button>
      </div>
    );
  }

  const { data } = state;
  return (
    <div className="space-y-5 xl:space-y-6">
      <StudioIntro data={data} />
      <div className="grid gap-5 xl:grid-cols-3 xl:gap-6">
        <div className="min-w-0 space-y-5 xl:col-span-2 xl:space-y-6">
          <AttentionPanel items={data.attention} now={data.generatedAt} />
          <QuickActions />
          <UpcomingEvents events={data.upcoming} demoHidden={data.upcomingDemoHidden} />
          <RecentUploads media={data.recentMedia} totals={data.mediaTotals} />
        </div>
        <div className="grid min-w-0 content-start gap-5 lg:grid-cols-2 xl:grid-cols-1 xl:gap-6">
          <ContentStatus content={data.content} />
          <InboxCard inbox={data.inbox} />
          <FanActivityCard activity={data.activity} />
          <StorageCard storage={data.storage} bandwidthNotice={data.bandwidthNotice} />
        </div>
      </div>
    </div>
  );
}
