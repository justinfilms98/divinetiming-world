'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import { isContentInboxEnabled } from '@/lib/features';
import type { InboxItem, DraftStatus, DraftType } from '@/lib/content-engine/types';
import { ExternalLink, X } from 'lucide-react';

const STATUS_TABS: { key: DraftStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'ignored', label: 'Ignored' },
  { key: 'error', label: 'Errors' },
];

const DRAFT_TYPE_OPTIONS: DraftType[] = [
  'unknown',
  'media',
  'video',
  'event',
  'release',
  'homepage_feature',
  'shop_promotion',
  'general_update',
];

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300',
  needs_review: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  published: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
  ignored: 'bg-slate-500/20 text-slate-300',
  error: 'bg-red-600/25 text-red-300',
};

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30';

export default function AdminInboxPage() {
  const enabled = isContentInboxEnabled();
  const { showToast } = useAdminToast();

  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<DraftStatus | 'all'>('all');

  // Manual import form
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importType, setImportType] = useState<DraftType | ''>('');
  const [importing, setImporting] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<InboxItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editType, setEditType] = useState<DraftType>('unknown');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const qs = tab === 'all' ? '' : `?status=${encodeURIComponent(tab)}`;
      const res = await fetch(`/api/admin/inbox${qs}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setItems((data.items as InboxItem[]) ?? []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, tab, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim() && !importTitle.trim()) {
      showToast('error', 'Enter a URL or a title.');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          url: importUrl.trim() || undefined,
          title: importTitle.trim() || undefined,
          draft_type: importType || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');
      setImportUrl('');
      setImportTitle('');
      setImportType('');
      showToast('success', data.duplicate ? 'Already in the inbox — no duplicate created.' : 'Draft created.');
      await load();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const patchItem = async (id: string, payload: Record<string, unknown>, successMsg: string) => {
    const res = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast('error', (data?.error as string) || 'Action failed');
      return false;
    }
    showToast('success', successMsg);
    await load();
    return true;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft? The source record is kept.')) return;
    const res = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast('error', (d?.error as string) || 'Delete failed');
      return;
    }
    showToast('success', 'Draft deleted');
    await load();
  };

  const openEdit = (item: InboxItem) => {
    setEditing(item);
    setEditTitle(item.title ?? '');
    setEditBody(item.body ?? '');
    setEditType(item.draft_type);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    const ok = await patchItem(
      editing.id,
      { title: editTitle, body: editBody, draft_type: editType },
      'Draft updated',
    );
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  if (!enabled) {
    return (
      <AdminPage title="Content Inbox" subtitle="Social & manual content drafts">
        <AdminCard>
          <p className="text-white/70">
            The Content Inbox is currently disabled. Set{' '}
            <code className="px-1 py-0.5 rounded bg-white/10">NEXT_PUBLIC_CONTENT_INBOX_ENABLED=1</code>{' '}
            and restart to enable it. No data is affected while disabled.
          </p>
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Content Inbox"
      subtitle="Import content, review AI/manual drafts, and publish into the site. Nothing is published until you approve it."
    >
      {/* Manual import */}
      <AdminCard className="mb-6">
        <form onSubmit={handleImport} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[280px] flex-1">
            <label className="block text-sm font-medium text-white/70 mb-1">Source URL (optional)</label>
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… or https://instagram.com/p/…"
              className={inputClass}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="block text-sm font-medium text-white/70 mb-1">Title (optional)</label>
            <input
              type="text"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              placeholder="Draft title"
              className={inputClass}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-white/70 mb-1">Type</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as DraftType | '')}
              className={inputClass}
            >
              <option value="">Auto-detect</option>
              {DRAFT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={importing || (!importUrl.trim() && !importTitle.trim())}
            className="px-4 py-2 rounded-lg bg-[#C6A75E] text-black font-medium hover:opacity-90 disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Add to inbox'}
          </button>
        </form>
      </AdminCard>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.key
                ? 'border-[#C6A75E] text-[#C6A75E] bg-[#C6A75E]/10'
                : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
            }`}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <AdminCard>
          <p className="text-white/50 text-center py-6">Loading…</p>
        </AdminCard>
      ) : items.length === 0 ? (
        <AdminCard>
          <p className="text-white/50 text-center py-6">Nothing here yet.</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const canPublish = item.status === 'approved' || item.status === 'needs_review';
            const isTerminal =
              item.status === 'published' || item.status === 'rejected' || item.status === 'ignored';
            return (
              <AdminCard key={item.id} className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${STATUS_BADGE[item.status] ?? 'bg-white/10 text-white/70'}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/60">
                      {item.draft_type.replace(/_/g, ' ')}
                    </span>
                    {item.source?.provider && (
                      <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/60">
                        {item.source.provider}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-white truncate">{item.title || '(untitled)'}</p>
                  {item.source?.source_url && (
                    <a
                      href={item.source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.source.source_url}</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
                  >
                    Edit
                  </button>
                  {!isTerminal && item.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => patchItem(item.id, { action: 'approve' }, 'Approved')}
                      className="px-3 py-1.5 text-sm rounded-lg border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10"
                    >
                      Approve
                    </button>
                  )}
                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => patchItem(item.id, { action: 'publish' }, 'Published')}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[#C6A75E] text-black font-medium hover:opacity-90"
                      title="Publish into the site (YouTube video drafts only in this phase)"
                    >
                      Publish
                    </button>
                  )}
                  {!isTerminal && (
                    <>
                      <button
                        type="button"
                        onClick={() => patchItem(item.id, { action: 'reject' }, 'Rejected')}
                        className="px-3 py-1.5 text-sm rounded-lg border border-red-400/30 text-red-300 hover:bg-red-400/10"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => patchItem(item.id, { action: 'ignore' }, 'Ignored')}
                        className="px-3 py-1.5 text-sm rounded-lg border border-white/15 text-white/60 hover:bg-white/10"
                      >
                        Ignore
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 text-sm rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog">
          <div className="bg-[#141014] border border-white/10 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Edit draft</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-2 text-white/50 hover:text-white rounded-lg" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Body</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={5} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Type</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value as DraftType)} className={inputClass}>
                  {DRAFT_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingEdit} className="px-4 py-2 rounded-lg bg-[#C6A75E] text-black font-medium hover:opacity-90 disabled:opacity-50">
                  {savingEdit ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-white/15 text-white/80 hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
