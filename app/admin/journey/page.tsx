'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, Save } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';

interface BlockRow {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  external_image_asset_id: string | null;
  align: 'left' | 'right' | 'center';
  display_order: number;
  external_image_asset?: { id: string; preview_url: string | null } | null;
}

function resolveImg(b: BlockRow): string | null {
  return b.external_image_asset?.preview_url ?? b.image_url ?? null;
}

export default function AdminJourneyPage() {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/journey-blocks', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(body.blocks)) {
      setBlocks(body.blocks as BlockRow[]);
    } else {
      setBlocks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createBlock = async () => {
    const res = await fetch('/api/admin/journey-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        title: 'New block',
        body: 'Write the story for this block.',
        align: blocks.length % 2 === 0 ? 'left' : 'right',
      }),
    });
    if (!res.ok) {
      showToast('error', 'Could not create block');
      return;
    }
    showToast('success', 'Block added');
    await load();
  };

  const updateLocal = (id: string, patch: Partial<BlockRow>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const saveBlock = async (block: BlockRow) => {
    setSaving(block.id);
    const res = await fetch('/api/admin/journey-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: block.id,
        title: block.title,
        body: block.body,
        image_url: block.image_url,
        external_image_asset_id: block.external_image_asset_id,
        align: block.align,
        display_order: block.display_order,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      showToast('error', 'Save failed');
      return;
    }
    showToast('success', 'Saved');
    await load();
  };

  const handleImageUploaded = (block: BlockRow) => (files: UploadedFile[]) => {
    const f = files[0];
    if (!f) return;
    updateLocal(block.id, { image_url: f.url, external_image_asset_id: f.id ?? null });
  };

  const deleteBlock = async (id: string) => {
    if (!window.confirm('Delete this block permanently?')) return;
    const res = await fetch(`/api/admin/journey-blocks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      showToast('error', 'Delete failed');
      return;
    }
    showToast('success', 'Deleted');
    await load();
  };

  const move = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const a = blocks[index];
    const b = blocks[target];
    if (!a || !b) return;
    const res = await fetch('/api/admin/journey-blocks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        items: [
          { id: a.id, display_order: b.display_order },
          { id: b.id, display_order: a.display_order },
        ],
      }),
    });
    if (!res.ok) {
      showToast('error', 'Reorder failed');
      return;
    }
    await load();
  };

  return (
    <AdminPage
      title="Journey"
      subtitle="Story blocks for the public /journey page."
      actions={
        <button
          type="button"
          onClick={createBlock}
          className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" />
          New Block
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <a
          href="/journey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
        >
          View journey page <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : blocks.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">
              No journey blocks yet. Create the first block to start building your story.
            </p>
            <button
              type="button"
              onClick={createBlock}
              className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            >
              <Plus className="w-4 h-4" />
              Create First Block
            </button>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-6">
          {blocks.map((block, index) => {
            const img = resolveImg(block);
            return (
              <AdminCard key={block.id}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">#{index + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {block.align}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className="p-1.5 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                  <div>
                    {img ? (
                      <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[4/5] w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                    <div className="mt-2 flex flex-col gap-2">
                      <UniversalUploader
                        acceptedTypes={['image']}
                        onSelected={handleImageUploaded(block)}
                        buttonLabel={img ? 'Replace' : 'Upload image'}
                        hideStorageTip
                      />
                      {img && (
                        <button
                          type="button"
                          onClick={() => updateLocal(block.id, { image_url: null, external_image_asset_id: null })}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={block.title ?? ''}
                        onChange={(e) => updateLocal(block.id, { title: e.target.value })}
                        className="admin-input w-full px-3 py-2"
                        placeholder="Block title"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1">Body</label>
                      <textarea
                        value={block.body ?? ''}
                        onChange={(e) => updateLocal(block.id, { body: e.target.value })}
                        rows={5}
                        className="admin-input w-full px-3 py-2 resize-vertical"
                        placeholder="Tell this part of the story…"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-slate-700 text-xs font-medium">Align:</label>
                        <select
                          value={block.align}
                          onChange={(e) => updateLocal(block.id, { align: e.target.value as 'left' | 'right' | 'center' })}
                          className="admin-input px-2 py-1.5 text-sm"
                        >
                          <option value="left">Image left</option>
                          <option value="right">Image right</option>
                          <option value="center">Centered (no side image)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveBlock(block)}
                        disabled={saving === block.id}
                        className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                      >
                        {saving === block.id ? 'Saving…' : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
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
