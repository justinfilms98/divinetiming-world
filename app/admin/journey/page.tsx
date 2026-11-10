'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, Save } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminDialog } from '@/components/admin/AdminDialog';
import { useUnsavedChangesGuard } from '@/components/admin/useUnsavedChangesGuard';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { describeSaveError } from '@/lib/admin/saveErrors';
import {
  applyChapterOrder,
  chapterImageUrl,
  chapterSavePayload,
  chapterView,
  dirtyChapterIds,
  editChapter,
  isChapterDirty,
  normalizeJourneyBlock,
  planChapterMove,
  replaceSavedRows,
  settleChapterCreated,
  settleChapterDeleted,
  settleChapterSaved,
  type JourneyBlock,
  type JourneyDraft,
  type JourneyEditorState,
} from '@/lib/admin/journeyDrafts';

type FetchResult = { ok: true; blocks: JourneyBlock[] } | { ok: false; status: number; error?: unknown };

async function fetchBlocks(): Promise<FetchResult> {
  try {
    const res = await fetch('/api/admin/journey-blocks', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(body.blocks)) return { ok: false, status: res.status, error: body?.error };
    return { ok: true, blocks: (body.blocks as Record<string, unknown>[]).map(normalizeJourneyBlock) };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function sendJson(url: string, method: string, payload?: unknown) {
  try {
    const res = await fetch(url, {
      method,
      headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: {} as Record<string, unknown> };
  }
}

function chapterName(block: { title?: string | null } | null | undefined): string {
  const t = block?.title?.trim();
  return t ? `chapter “${t}”` : 'this chapter';
}

export default function AdminJourneyPage() {
  const [editor, setEditor] = useState<JourneyEditorState>({ rows: [], drafts: {} });
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [chapterErrors, setChapterErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<'create' | 'reorder' | null>(null);
  const { showToast } = useAdminToast();
  const dialog = useAdminDialog();
  /** Latest state for async handlers (a save resolving after other edits must not use a stale copy). */
  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const update = useCallback((fn: (prev: JourneyEditorState) => JourneyEditorState) => {
    setEditor((prev) => {
      const next = fn(prev);
      editorRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBlocks().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        update((prev) => replaceSavedRows(prev, result.blocks));
        setLoadState('ready');
        setLoadError(null);
      } else {
        setLoadState((s) => (s === 'ready' ? 'ready' : 'error'));
        setLoadError(describeSaveError({ status: result.status, serverMessage: result.error, subject: 'the chapters', editsKept: false, action: 'load' }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadAttempt, update]);

  const dirtyIds = dirtyChapterIds(editor);
  const anyUploading = Object.values(uploading).some(Boolean);
  useUnsavedChangesGuard(
    dirtyIds.length > 0 || anyUploading,
    anyUploading
      ? 'An image is still uploading. Leaving now cancels it.'
      : `${dirtyIds.length} chapter${dirtyIds.length === 1 ? ' has' : 's have'} unsaved changes. Leaving now discards them.`
  );

  /** Re-read saved rows without touching anyone's unsaved drafts (used after a failed reorder). */
  const refreshSavedRows = async () => {
    const result = await fetchBlocks();
    if (result.ok) update((prev) => replaceSavedRows(prev, result.blocks));
  };

  const setChapterError = (id: string, msg: string | null) => setChapterErrors((prev) => ({ ...prev, [id]: msg }));

  const createBlock = async () => {
    setBusy('create');
    const { ok, status, body } = await sendJson('/api/admin/journey-blocks', 'POST', {
      title: '',
      era_label: '',
      body: '',
      align: editorRef.current.rows.length % 2 === 0 ? 'left' : 'right',
      status: 'draft',
    });
    setBusy(null);
    if (!ok || !body.block) {
      showToast('error', describeSaveError({ status, serverMessage: body.error, subject: 'the new chapter', editsKept: false }));
      return;
    }
    update((prev) => settleChapterCreated(prev, normalizeJourneyBlock(body.block as Record<string, unknown>)));
    showToast('success', 'Chapter added (as a draft)');
  };

  const editLocal = (id: string, patch: JourneyDraft) => {
    update((prev) => editChapter(prev, id, patch));
    if (chapterErrors[id]) setChapterError(id, null);
  };

  const saveBlock = async (id: string) => {
    const payload = chapterSavePayload(editorRef.current, id);
    if (!payload) return;
    const sent: JourneyDraft = { ...editorRef.current.drafts[id] };
    setSaving((prev) => ({ ...prev, [id]: true }));
    setChapterError(id, null);
    const { ok, status, body } = await sendJson('/api/admin/journey-blocks', 'POST', payload);
    setSaving((prev) => ({ ...prev, [id]: false }));
    if (!ok || !body.block) {
      const msg = describeSaveError({ status, serverMessage: body.error, subject: chapterName(payload) });
      setChapterError(id, msg);
      showToast('error', msg);
      return;
    }
    update((prev) => settleChapterSaved(prev, normalizeJourneyBlock(body.block as Record<string, unknown>), sent));
    showToast('success', 'Saved');
  };

  const handleImageUploaded = (id: string) => (files: UploadedFile[]) => {
    const f = files[0];
    if (!f) return;
    editLocal(id, { image_url: f.url, external_image_asset_id: f.id ?? null });
  };

  const deleteBlock = async (id: string) => {
    const view = chapterView(editorRef.current, id);
    const ok = await dialog.confirm({
      title: 'Delete this chapter?',
      message: `${isChapterDirty(editorRef.current, id) ? 'It has unsaved changes. ' : ''}The journey block will be deleted permanently. This cannot be undone. Its image stays in the Media Library.`,
      confirmLabel: 'Delete chapter',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await sendJson(`/api/admin/journey-blocks?id=${encodeURIComponent(id)}`, 'DELETE');
    if (!res.ok) {
      showToast('error', describeSaveError({ status: res.status, serverMessage: res.body.error, subject: chapterName(view), editsKept: false, action: 'delete' }));
      return;
    }
    update((prev) => settleChapterDeleted(prev, id));
    showToast('success', 'Deleted');
  };

  const move = async (id: string, dir: 'up' | 'down') => {
    const plan = planChapterMove(editorRef.current, id, dir);
    if (!plan || plan.changes.length === 0) return;
    setBusy('reorder');
    const res = await sendJson('/api/admin/journey-blocks', 'PATCH', { items: plan.changes });
    if (!res.ok) {
      await refreshSavedRows();
      setBusy(null);
      showToast(
        'error',
        describeSaveError({
          status: res.status,
          serverMessage: res.body.error,
          subject: 'the chapters',
          action: 'reorder',
          keptNote: 'The list now shows the order that is actually saved; unsaved chapter edits are kept.',
        })
      );
      return;
    }
    update((prev) => applyChapterOrder(prev, plan.changes));
    setBusy(null);
  };

  const rows = editor.rows;

  return (
    <AdminPage
      title="Journey"
      subtitle="Timeline chapters for the public /journey page. Drafts stay hidden until you publish."
      actions={
        <button
          type="button"
          onClick={createBlock}
          disabled={busy === 'create' || loadState !== 'ready'}
          className="admin-btn-primary admin-tap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {busy === 'create' ? 'Adding…' : 'New Chapter'}
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <a
          href="/journey"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-tap inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          View journey page <ExternalLink className="w-4 h-4" />
        </a>
        {dirtyIds.length > 0 && (
          <span className="text-sm font-medium text-amber-700" role="status">
            {dirtyIds.length} chapter{dirtyIds.length === 1 ? '' : 's'} with unsaved changes
          </span>
        )}
      </div>

      {loadState === 'loading' ? (
        <p className="text-slate-500">Loading…</p>
      ) : loadState === 'error' ? (
        <AdminCard>
          <div className="py-8 text-center" role="alert">
            <p className="text-slate-700 font-medium mb-1">The chapters couldn&apos;t be loaded. Nothing has been changed.</p>
            <p className="text-slate-500 text-sm mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoadState('loading');
                setLoadAttempt((n) => n + 1);
              }}
              className="admin-btn-primary admin-tap inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </AdminCard>
      ) : rows.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">
              No journey chapters yet. Create the first chapter to start the timeline.
            </p>
            <button
              type="button"
              onClick={createBlock}
              disabled={busy === 'create'}
              className="admin-btn-primary admin-tap inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            >
              <Plus className="w-4 h-4" />
              Create First Chapter
            </button>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-6">
          {rows.map((row, index) => {
            const block = chapterView(editor, row.id) ?? row;
            const img = chapterImageUrl(editor, row.id);
            const dirty = isChapterDirty(editor, row.id);
            const isSaving = !!saving[row.id];
            const isUploading = !!uploading[row.id];
            const error = chapterErrors[row.id];
            return (
              <AdminCard key={row.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 font-medium">#{index + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {block.align}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
                        row.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {row.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    {dirty && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 font-medium" data-unsaved>
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => move(row.id, 'up')}
                      disabled={index === 0 || busy === 'reorder'}
                      className="admin-icon-btn text-slate-500 hover:text-slate-800 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                      aria-label="Move chapter up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(row.id, 'down')}
                      disabled={index === rows.length - 1 || busy === 'reorder'}
                      className="admin-icon-btn text-slate-500 hover:text-slate-800 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                      aria-label="Move chapter down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(row.id)}
                      disabled={isSaving}
                      className="admin-icon-btn text-red-500 hover:text-red-700 hover:bg-red-500/10"
                      title="Delete"
                      aria-label="Delete chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                  <div>
                    {img ? (
                      <div className="relative aspect-[4/5] w-full max-h-[40svh] md:max-h-none rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[4/5] w-full max-h-[25svh] md:max-h-none rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-2">
                      <UniversalUploader
                        acceptedTypes={['image']}
                        onSelected={handleImageUploaded(row.id)}
                        onUploadingChange={(u) => setUploading((prev) => ({ ...prev, [row.id]: u }))}
                        buttonLabel={img ? 'Replace' : 'Upload image'}
                        hideStorageTip
                      />
                      {img && (
                        <button
                          type="button"
                          onClick={() => editLocal(row.id, { image_url: null, external_image_asset_id: null })}
                          disabled={isUploading}
                          className="admin-tap inline-flex items-center justify-center rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-500/10"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1" htmlFor={`journey-title-${row.id}`}>Title</label>
                      <input
                        id={`journey-title-${row.id}`}
                        type="text"
                        value={block.title ?? ''}
                        onChange={(e) => editLocal(row.id, { title: e.target.value })}
                        className="admin-input w-full px-3 py-2"
                        placeholder="Chapter title"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1" htmlFor={`journey-era-${row.id}`}>
                        Era / date label
                      </label>
                      <input
                        id={`journey-era-${row.id}`}
                        type="text"
                        value={block.era_label ?? ''}
                        onChange={(e) => editLocal(row.id, { era_label: e.target.value })}
                        className="admin-input w-full px-3 py-2"
                        placeholder="e.g. Formation · 2018"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1" htmlFor={`journey-body-${row.id}`}>Body</label>
                      <textarea
                        id={`journey-body-${row.id}`}
                        value={block.body ?? ''}
                        onChange={(e) => editLocal(row.id, { body: e.target.value })}
                        rows={5}
                        className="admin-input w-full px-3 py-2 resize-vertical"
                        placeholder="Tell this part of the story…"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                          <label className="text-slate-700 text-xs font-medium" htmlFor={`journey-align-${row.id}`}>
                            Align
                          </label>
                          <select
                            id={`journey-align-${row.id}`}
                            value={block.align}
                            onChange={(e) => editLocal(row.id, { align: e.target.value as 'left' | 'right' | 'center' })}
                            className="admin-input admin-tap w-full sm:w-auto min-w-0 px-2 py-1.5 text-sm"
                          >
                            <option value="left">Image left</option>
                            <option value="right">Image right</option>
                            <option value="center">Centered (no side image)</option>
                          </select>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                          <label className="text-slate-700 text-xs font-medium" htmlFor={`journey-status-${row.id}`}>
                            Visibility
                          </label>
                          <select
                            id={`journey-status-${row.id}`}
                            value={block.status ?? 'draft'}
                            onChange={(e) =>
                              editLocal(row.id, { status: e.target.value as 'draft' | 'published' })
                            }
                            className="admin-input admin-tap w-full sm:w-auto min-w-0 px-2 py-1.5 text-sm"
                          >
                            <option value="draft">Draft (hidden)</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveBlock(row.id)}
                        disabled={isSaving || isUploading}
                        title={isUploading ? 'Wait for the image upload to finish' : undefined}
                        className="admin-btn-primary admin-tap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm w-full sm:w-auto disabled:opacity-50"
                      >
                        {isSaving ? 'Saving…' : isUploading ? 'Uploading…' : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
