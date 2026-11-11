'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, NotebookPen, Plus, Trash2, Video } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminDialog } from '@/components/admin/AdminDialog';
import { JournalEpisodeEditor, type GalleryOption } from '@/components/admin/journal/JournalEpisodeEditor';
import { createClient } from '@/lib/supabase/client';
import { describeSaveError } from '@/lib/admin/saveErrors';
import { episodeLabel } from '@/lib/journal/rules';
import { JOURNAL_STATUS_LABELS, type AdminJournalEpisode, type JournalStatus } from '@/lib/journal/types';

const STATUS_BADGE: Record<JournalStatus, string> = {
  draft: 'bg-amber-500/20 text-amber-400',
  coming_soon: 'bg-sky-500/20 text-sky-300',
  published: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-slate-500/20 text-slate-400',
};

async function fetchEpisodes(): Promise<{ ok: boolean; status: number; list: AdminJournalEpisode[] }> {
  try {
    const res = await fetch('/api/admin/journal', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && body.ok, status: res.status, list: Array.isArray(body.data) ? body.data : [] };
  } catch {
    return { ok: false, status: 0, list: [] };
  }
}

export default function AdminJournalPage() {
  const [episodes, setEpisodes] = useState<AdminJournalEpisode[]>([]);
  const [galleries, setGalleries] = useState<GalleryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminJournalEpisode | 'new' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useAdminToast();
  const dialog = useAdminDialog();
  const [publicEnabled, setPublicEnabled] = useState(false);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchEpisodes>>) => {
    if (result.ok) {
      setEpisodes(result.list);
      setLoadError(null);
    } else {
      setLoadError(describeSaveError({ status: result.status, subject: 'the Journal', action: 'load', editsKept: false }));
    }
    setLoading(false);
  }, []);

  const load = useCallback(async () => apply(await fetchEpisodes()), [apply]);

  useEffect(() => {
    let cancelled = false;
    fetchEpisodes().then((result) => {
      if (!cancelled) apply(result);
    });
    createClient()
      .from('journal_settings')
      .select('public_enabled')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setPublicEnabled(data?.public_enabled === true);
      });
    createClient()
      .from('galleries')
      .select('id, name, status')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setGalleries((data ?? []) as GalleryOption[]);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const move = async (index: number, direction: -1 | 1) => {
    const a = episodes[index];
    const b = episodes[index + direction];
    if (!a || !b) return;
    // Positions may tie (e.g. both 0); give them distinct values so the swap is visible.
    const aOrder = a.display_order === b.display_order ? index : a.display_order;
    const bOrder = a.display_order === b.display_order ? index + direction : b.display_order;
    setBusy(a.id);
    try {
      const res = await fetch('/api/admin/journal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ swap: [{ id: a.id, display_order: aOrder }, { id: b.id, display_order: bOrder }] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        showToast('error', describeSaveError({ status: res.status, serverMessage: body.error, subject: 'the order', action: 'reorder', editsKept: false }));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (episode: AdminJournalEpisode) => {
    const ok = await dialog.confirm({
      title: `Delete “${episode.title}”?`,
      message: 'This draft and its video link are removed for good. Its cover stays in the Media Library.',
      confirmLabel: 'Delete draft',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(episode.id);
    try {
      const res = await fetch(`/api/admin/journal?id=${encodeURIComponent(episode.id)}`, { method: 'DELETE', credentials: 'same-origin' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        showToast('error', describeSaveError({ status: res.status, serverMessage: body.error, subject: 'the episode', action: 'delete', editsKept: false }));
        return;
      }
      showToast('success', `“${episode.title}” deleted.`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminPage
      title="Journal"
      subtitle="Vlog episodes and travel stories. New episodes start as drafts."
      actions={
        <button type="button" onClick={() => setEditing('new')} className="admin-btn-primary admin-tap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white">
          <Plus className="w-4 h-4" />
          New episode
        </button>
      }
    >
      <p className={`mb-4 rounded-lg border p-3 text-sm ${publicEnabled ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200' : 'border-white/10 bg-white/5 text-white/70'}`} role="status">
        {publicEnabled
          ? 'The public Journal is on: published and coming-soon episodes appear at /journal.'
          : 'The public Journal is switched off, so nothing here is visible on the site yet. Prepare episodes now; they appear once the Journal launches.'}
      </p>

      {loading ? (
        <div className="text-white/50">Loading…</div>
      ) : loadError ? (
        <AdminCard>
          <p className="text-red-300 text-sm" role="alert">{loadError}</p>
          <button type="button" onClick={() => void load()} className="admin-tap mt-3 px-4 py-2 rounded-lg border border-white/20 text-white/80 text-sm">Try again</button>
        </AdminCard>
      ) : episodes.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={NotebookPen}
            title="No episodes yet"
            description="Add the first episode with its title, cover and summary. It stays a draft until you choose Coming soon or Published."
            action={
              <button type="button" onClick={() => setEditing('new')} className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium mx-auto">
                <Plus className="w-4 h-4" />
                New episode
              </button>
            }
          />
        </AdminCard>
      ) : (
        <ol className="grid gap-3" aria-label="Episodes in their public order">
          {episodes.map((episode, index) => {
            const label = episodeLabel(episode);
            const deletable = episode.status === 'draft' && !episode.published_at;
            return (
              <li key={episode.id}>
                <AdminCard className="p-0 overflow-hidden">
                  <div className="flex min-w-0 items-stretch">
                    <button type="button" onClick={() => setEditing(episode)} className="flex min-w-0 flex-1 items-stretch text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C6A75E]" aria-label={`Edit ${episode.title}`}>
                      <div className="w-24 sm:w-36 flex-shrink-0 aspect-video bg-white/5">
                        {episode.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={episode.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <NotebookPen className="w-7 h-7 text-[#C6A75E]/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {label && <span className="text-[var(--accent)] text-xs uppercase tracking-wider font-semibold">{label}</span>}
                          <span className={`px-2 py-0.5 text-xs rounded ${STATUS_BADGE[episode.status]}`}>{JOURNAL_STATUS_LABELS[episode.status]}</span>
                          {episode.video && (
                            <span className="inline-flex items-center gap-1 text-xs text-white/50">
                              <Video className="w-3.5 h-3.5" aria-hidden /> Video
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>{episode.title}</h3>
                        <p className="text-white/40 text-xs truncate">/journal/{episode.slug}</p>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col justify-center sm:flex-row sm:items-center gap-1 pr-2">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || !!busy} className="admin-icon-btn text-white/60 hover:text-white disabled:opacity-30" aria-label={`Move ${episode.title} up`}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === episodes.length - 1 || !!busy} className="admin-icon-btn text-white/60 hover:text-white disabled:opacity-30" aria-label={`Move ${episode.title} down`}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      {deletable && (
                        <button type="button" onClick={() => remove(episode)} disabled={!!busy} className="admin-icon-btn text-red-400/70 hover:text-red-400 hover:bg-red-400/10" aria-label={`Delete ${episode.title}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </AdminCard>
              </li>
            );
          })}
        </ol>
      )}

      {editing && (
        <JournalEpisodeEditor
          key={editing === 'new' ? 'new' : editing.id}
          episode={editing === 'new' ? null : editing}
          galleries={galleries}
          onClose={() => setEditing(null)}
          onSaved={(saved, message) => {
            setEditing(null);
            showToast('success', message);
            setEpisodes((prev) => {
              const exists = prev.some((e) => e.id === saved.id);
              return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev];
            });
            void load();
          }}
        />
      )}
    </AdminPage>
  );
}
