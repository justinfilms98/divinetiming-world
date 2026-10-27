'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlarmClock, CheckCircle2, ChevronRight } from 'lucide-react';
import { visibleAttention, type AttentionItem, type Severity } from '@/lib/admin/overview';

const SNOOZE_KEY = 'dt-admin-snoozes-v1';
const SNOOZE_DAYS = 7;
const INITIAL_VISIBLE = 5;

function readSnoozes(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function snoozeEndsAt(): string {
  return new Date(Date.now() + SNOOZE_DAYS * 86_400_000).toISOString();
}

function writeSnoozes(next: Record<string, string>) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage full: snoozing just won't persist.
  }
}

const SEVERITY_STYLE: Record<Severity, { dot: string; label: string }> = {
  urgent: { dot: 'bg-rose-400', label: 'Urgent' },
  important: { dot: 'bg-[#C6A75E]', label: 'Important' },
  reminder: { dot: 'bg-white/35', label: 'Reminder' },
};

/** Snoozes are stored on this device only; nothing is written to the database. */
export function AttentionPanel({ items, now }: { items: AttentionItem[]; now: string }) {
  const [snoozes, setSnoozes] = useState<Record<string, string>>(() => readSnoozes());
  const [showAll, setShowAll] = useState(false);
  const { visible, snoozed } = visibleAttention(items, snoozes, new Date(now));
  const shown = showAll ? visible : visible.slice(0, INITIAL_VISIBLE);
  const urgentCount = visible.filter((i) => i.severity === 'urgent').length;

  const snooze = (id: string) => {
    const next = { ...snoozes, [id]: snoozeEndsAt() };
    setSnoozes(next);
    writeSnoozes(next);
  };

  const restore = () => {
    const next: Record<string, string> = {};
    setSnoozes(next);
    writeSnoozes(next);
  };

  return (
    <section aria-labelledby="attention-heading" className="rounded-2xl border border-[#C6A75E]/25 bg-gradient-to-b from-[#C6A75E]/[0.07] to-white/[0.02] p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="attention-heading" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A75E]">
          Needs your attention
        </h2>
        {visible.length > 0 && (
          <span className="text-xs text-white/50">
            {urgentCount > 0 ? `${urgentCount} urgent · ` : ''}
            {visible.length} {visible.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[#C6A75E]" aria-hidden />
          <p className="text-sm leading-relaxed">All clear. Nothing needs your attention right now.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {shown.map((item) => {
            const style = SEVERITY_STYLE[item.severity];
            return (
              <li key={item.id} className="flex items-stretch gap-1">
                <Link href={item.href} className="group flex min-h-[56px] flex-1 items-start gap-3 rounded-xl py-3 pr-1 -ml-1 pl-1 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75E]/60">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">{style.label}: </span>
                    <span className="block text-[15px] font-medium leading-snug text-white">{item.title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-white/55">{item.detail}</span>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-[#C6A75E]">
                      {item.action}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </span>
                </Link>
                {item.snoozable && (
                  <button
                    type="button"
                    onClick={() => snooze(item.id)}
                    className="admin-icon-btn mt-2 shrink-0 rounded-xl text-white/40 hover:bg-white/5 hover:text-white/80"
                    aria-label={`Snooze for ${SNOOZE_DAYS} days: ${item.title}`}
                    title={`Snooze for ${SNOOZE_DAYS} days`}
                  >
                    <AlarmClock className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(visible.length > INITIAL_VISIBLE || snoozed > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-2">
          {visible.length > INITIAL_VISIBLE && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="admin-tap text-sm font-medium text-white/70 hover:text-white">
              {showAll ? 'Show fewer' : `Show all ${visible.length}`}
            </button>
          )}
          {snoozed > 0 && (
            <button type="button" onClick={restore} className="admin-tap text-sm text-white/45 hover:text-white/80">
              {snoozed} snoozed · show again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
