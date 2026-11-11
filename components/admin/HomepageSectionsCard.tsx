'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import { describeSaveError } from '@/lib/admin/saveErrors';
import { revalidatePaths } from '@/lib/revalidate';
import { HOME_SECTIONS, resolveHomeSections, type HomeSectionId, type HomeSectionVisibility } from '@/lib/site/homeSections';
import { cn } from '@/lib/ui/cn';

type LoadState = 'loading' | 'ready' | 'needs-migration' | 'error';

/** Show/hide switches for homepage sections. Each switch saves on its own. */
export function HomepageSectionsCard() {
  const [state, setState] = useState<LoadState>('loading');
  const [sections, setSections] = useState<HomeSectionVisibility>(resolveHomeSections(null));
  const [busy, setBusy] = useState<HomeSectionId | null>(null);
  const { showToast } = useAdminToast();

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from('site_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) return setState('error');
        const row = data as Record<string, unknown>;
        if (!('home_sections' in row)) return setState('needs-migration');
        setSections(resolveHomeSections(row.home_sections));
        setState('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (id: HomeSectionId) => {
    const next = !sections[id];
    setBusy(id);
    setSections((prev) => ({ ...prev, [id]: next }));
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ home_sections: { [id]: next } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSections((prev) => ({ ...prev, [id]: !next }));
        showToast('error', describeSaveError({ status: res.status, serverMessage: data?.error, subject: 'the homepage sections' }));
        return;
      }
      setSections(resolveHomeSections(data?.settings?.home_sections));
      await revalidatePaths(['/']);
      const label = HOME_SECTIONS.find((s) => s.id === id)?.label ?? id;
      showToast('success', `${label} is now ${next ? 'shown' : 'hidden'} on the homepage.`);
    } catch {
      setSections((prev) => ({ ...prev, [id]: !next }));
      showToast('error', "Couldn't reach the server. Nothing was changed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminCard className="mt-6">
      <h2 className="text-lg font-semibold text-white mb-1">Homepage sections</h2>
      <p className="text-white/40 text-sm mb-4">
        Show or hide each section below the hero. Changes save straight away. Hiding a section keeps its content; switch it
        back on at any time.
      </p>
      {state === 'loading' && <p className="text-white/50 text-sm">Loading…</p>}
      {state === 'error' && <p className="text-red-400 text-sm" role="alert">Couldn&apos;t load the homepage settings. Reload to try again.</p>}
      {state === 'needs-migration' && (
        <p className="text-white/50 text-sm">These switches become available after the database update (migration 059).</p>
      )}
      {state === 'ready' && (
        <ul className="divide-y divide-white/10">
          {HOME_SECTIONS.map((section) => {
            const on = sections[section.id];
            return (
              <li key={section.id} className="flex items-center justify-between gap-4 py-2">
                <div className="min-w-0">
                  <p id={`home-section-${section.id}`} className="text-sm font-medium text-white">
                    {section.label}
                  </p>
                  <p className="text-xs text-white/40">
                    {section.hint}
                    {section.id === 'tribe' && !on ? ' · Hero buttons that point to #tribe are hidden too.' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={`home-section-${section.id}`}
                  disabled={busy !== null}
                  onClick={() => toggle(section.id)}
                  className="admin-tap shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'relative inline-flex h-6 w-11 rounded-full transition-colors',
                      on ? 'bg-amber-400' : 'bg-white/20'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        on ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )}
                    />
                  </span>
                  <span className="sr-only">{on ? 'Shown' : 'Hidden'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
