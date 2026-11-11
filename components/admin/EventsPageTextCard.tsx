'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useUnsavedChangesGuard } from '@/components/admin/useUnsavedChangesGuard';
import { describeSaveError } from '@/lib/admin/saveErrors';
import { revalidatePaths } from '@/lib/revalidate';
import { checkEventsCopyInput, EVENTS_COPY_FIELDS, type EventsCopyKey } from '@/lib/site/eventsCopy';
import { cn } from '@/lib/ui/cn';

type Draft = Record<EventsCopyKey, string> & { show_touring_summary: boolean };
type LoadState = 'loading' | 'ready' | 'needs-migration' | 'error';

function draftFrom(raw: unknown): Draft {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const d = { show_touring_summary: src.show_touring_summary !== false } as Draft;
  for (const f of EVENTS_COPY_FIELDS) d[f.key] = typeof src[f.key] === 'string' ? (src[f.key] as string) : '';
  return d;
}

/** Headings and supporting text on the public Events page. Empty fields use today's wording. */
export function EventsPageTextCard() {
  const [state, setState] = useState<LoadState>('loading');
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Draft>(draftFrom(null));
  const [draft, setDraft] = useState<Draft>(draftFrom(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useAdminToast();

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from('page_settings')
      .select('*')
      .eq('page_slug', 'events')
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) return setState('error');
        const row = (data ?? {}) as Record<string, unknown>;
        if (data && !('section_copy' in row)) return setState('needs-migration');
        const d = draftFrom(row.section_copy);
        setSaved(d);
        setDraft(d);
        setState('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  useUnsavedChangesGuard(dirty, 'Your Events page text changes haven’t been saved.');

  const save = async () => {
    setError(null);
    const checked = checkEventsCopyInput(draft);
    if (!checked.ok) return setError(checked.error);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/page-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ page_slug: 'events', section_copy: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && typeof data?.error === 'string') setError(data.error);
        else showToast('error', describeSaveError({ status: res.status, serverMessage: data?.error, subject: 'the Events page text' }));
        return;
      }
      const d = draftFrom(data?.section_copy);
      setSaved(d);
      setDraft(d);
      await revalidatePaths(['/events']);
      showToast('success', 'Events page text saved');
    } catch {
      showToast('error', "Couldn't reach the server. Your text is still here; try Save again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="events-page-text"
        className="admin-tap w-full min-h-[44px] flex items-center justify-between gap-3 text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        <span>
          <span className="block text-lg font-semibold text-white">Events page text</span>
          <span className="block text-sm text-white/40">Section headings and supporting lines on /events. Event dates and details are edited below.</span>
        </span>
        <ChevronDown className={cn('w-5 h-5 text-white/60 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div id="events-page-text" className="mt-4">
          {state === 'loading' && <p className="text-white/50 text-sm">Loading…</p>}
          {state === 'error' && <p className="text-red-400 text-sm" role="alert">Couldn&apos;t load the Events page text. Reload to try again.</p>}
          {state === 'needs-migration' && (
            <p className="text-white/50 text-sm">Editable Events page text becomes available after the database update (migration 059).</p>
          )}
          {state === 'ready' && (
            <div className="space-y-4">
              <p className="text-xs text-white/40">Leave a field empty to keep the current wording, shown in grey. Plain text only.</p>
              {EVENTS_COPY_FIELDS.map((f) => {
                const id = `events-copy-${f.key}`;
                const value = draft[f.key];
                const common = {
                  id,
                  value,
                  maxLength: f.max,
                  placeholder: f.fallback || 'Uses the automatic shows/cities sentence',
                  onChange: (e: { target: { value: string } }) => {
                    setError(null);
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }));
                  },
                  className: 'admin-input w-full px-3 py-2',
                };
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-1">
                      {f.label}
                    </label>
                    {f.multiline ? <textarea rows={2} {...common} /> : <input type="text" {...common} />}
                    <p className="text-xs text-white/30 mt-1 text-right">
                      {value.length}/{f.max}
                    </p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-4 min-h-[44px]">
                <div className="min-w-0">
                  <p id="events-copy-summary-label" className="text-sm font-medium text-white/70">Show the shows/cities line</p>
                  <p className="text-xs text-white/40">The automatic &ldquo;N shows · N cities&rdquo; summary under Touring history.</p>
                </div>
                <span className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <input
                    type="checkbox"
                    aria-labelledby="events-copy-summary-label"
                    checked={draft.show_touring_summary}
                    onChange={(e) => setDraft((d) => ({ ...d, show_touring_summary: e.target.checked }))}
                    className="w-6 h-6 accent-amber-400"
                  />
                </span>
              </div>
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !dirty}
                  className="admin-btn-primary admin-tap flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                >
                  <Save className="w-4 h-4" aria-hidden />
                  {saving ? 'Saving…' : 'Save Events text'}
                </button>
                {dirty && !saving && (
                  <span className="text-sm text-amber-300" role="status">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminCard>
  );
}
