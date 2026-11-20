'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlarmClock, CheckCircle2, ChevronRight, X } from 'lucide-react';
import {
  missionCategoryLabel,
  visibleMissions,
  type MissionItem,
} from '@/lib/admin/overview';

const SNOOZE_KEY = 'dt-admin-mission-snoozes-v1';
const DISMISS_KEY = 'dt-admin-mission-dismissals-v1';
const SEEN_KEY = 'dt-admin-mission-seen-v1';
const SNOOZE_DAYS = 7;
const INITIAL_VISIBLE = 5;
const COMPLETED_MAX = 3;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: preference just won't persist.
  }
}

type SeenMission = { id: string; title: string };

function readSeen(key: string): SeenMission[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as SeenMission[]) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.id === 'string') : [];
  } catch {
    return [];
  }
}

function writeSeen(key: string, rows: SeenMission[]) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

function snoozeEndsAt(): string {
  return new Date(Date.now() + SNOOZE_DAYS * 86_400_000).toISOString();
}

/** Soft suggestions under Needs Attention. Snooze / dismiss stay on this device only. */
export function MissionPanel({ items, now }: { items: MissionItem[]; now: string }) {
  const [snoozes, setSnoozes] = useState<Record<string, string>>(() => readJson(SNOOZE_KEY, {}));
  const [dismissals, setDismissals] = useState<string[]>(() => readJson(DISMISS_KEY, []));
  const [completed, setCompleted] = useState<{ id: string; title: string }[]>([]);
  const [showAll, setShowAll] = useState(false);

  const { visible, snoozed, dismissed } = visibleMissions(items, snoozes, dismissals, new Date(now));
  const shown = showAll ? visible : visible.slice(0, INITIAL_VISIBLE);

  // Track missions that vanish this session as “recently completed” (not dismissed).
  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    const prev = readSeen(SEEN_KEY);
    const vanished = prev.filter((s) => !currentIds.has(s.id) && !dismissals.includes(s.id));
    if (vanished.length > 0) {
      setCompleted((prevCompleted) =>
        [...vanished, ...prevCompleted].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i).slice(0, COMPLETED_MAX)
      );
    }
    writeSeen(
      SEEN_KEY,
      items.map((i) => ({ id: i.id, title: i.title }))
    );

    const pruned = dismissals.filter((id) => currentIds.has(id));
    if (pruned.length !== dismissals.length) {
      setDismissals(pruned);
      writeJson(DISMISS_KEY, pruned);
    }
  }, [items, dismissals]);

  const snooze = (id: string) => {
    const next = { ...snoozes, [id]: snoozeEndsAt() };
    setSnoozes(next);
    writeJson(SNOOZE_KEY, next);
  };

  const dismiss = (id: string) => {
    const next = dismissals.includes(id) ? dismissals : [...dismissals, id];
    setDismissals(next);
    writeJson(DISMISS_KEY, next);
  };

  const restore = () => {
    setSnoozes({});
    writeJson(SNOOZE_KEY, {});
    setDismissals([]);
    writeJson(DISMISS_KEY, []);
  };

  return (
    <section aria-labelledby="missions-heading" className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="missions-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Your next moves
        </h2>
        {visible.length > 0 && (
          <span className="text-xs text-white/45">
            {visible.length} {visible.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-white/40" aria-hidden />
          <p className="text-sm leading-relaxed">You&apos;re caught up. Merch and events look ready for the moment.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {shown.map((item) => (
            <MissionRow key={item.id} item={item} onSnooze={() => snooze(item.id)} onDismiss={() => dismiss(item.id)} />
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Recently completed</p>
          <ul className="mt-1.5 space-y-1">
            {completed.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-white/45">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#C6A75E]/70" aria-hidden />
                <span className="truncate">{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(visible.length > INITIAL_VISIBLE || snoozed > 0 || dismissed > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-2">
          {visible.length > INITIAL_VISIBLE && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="min-h-11 text-[15px] font-medium text-white/75 hover:text-white">
              {showAll ? 'Show fewer' : `Show all ${visible.length}`}
            </button>
          )}
          {(snoozed > 0 || dismissed > 0) && (
            <button type="button" onClick={restore} className="min-h-11 text-sm text-white/55 hover:text-white/85">
              {[snoozed > 0 ? `${snoozed} snoozed` : null, dismissed > 0 ? `${dismissed} hidden` : null].filter(Boolean).join(' · ')} · show again
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function MissionRow({ item, onSnooze, onDismiss }: { item: MissionItem; onSnooze: () => void; onDismiss: () => void }) {
  return (
    <li className="flex items-stretch gap-1">
      <Link
        href={item.href}
        className="group flex min-h-[56px] flex-1 items-start gap-3 rounded-xl py-3 pr-1 -ml-1 pl-1 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75E]/60"
      >
        <span className="mt-0.5 shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {missionCategoryLabel(item.category)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium leading-snug text-white">{item.title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-white/55">{item.detail}</span>
          <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-[#C6A75E]">
            {item.action}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
      <div className="mt-2 flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          onClick={onSnooze}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/45 hover:bg-white/5 hover:text-white/80"
          aria-label={`Snooze for ${SNOOZE_DAYS} days: ${item.title}`}
          title={`Snooze for ${SNOOZE_DAYS} days`}
        >
          <AlarmClock className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/35 hover:bg-white/5 hover:text-white/70"
          aria-label={`Not relevant: ${item.title}`}
          title="Not relevant"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
