'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { createClient } from '@/lib/supabase/client';
import { X, ImageIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';

type GalleryStatus = 'draft' | 'published' | 'archived';

interface GalleryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  external_cover_asset_id?: string | null;
  display_order: number;
  status?: GalleryStatus;
  is_featured?: boolean;
  theme?: string | null;
  gallery_media?: { id: string }[];
}

/** Loaded in edit modal: gallery_media row id + resolved preview for display */
interface GalleryMediaItem {
  id: string;
  preview_url: string | null;
  media_type: string;
  caption: string | null;
  display_order: number;
}

export default function AdminCollectionsPage() {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editStatus, setEditStatus] = useState<GalleryStatus>('draft');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addMediaPickerOpen, setAddMediaPickerOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const [galleryMediaDetail, setGalleryMediaDetail] = useState<GalleryMediaItem[]>([]);
  const [loadingMediaDetail, setLoadingMediaDetail] = useState(false);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('galleries')
      .select('*, gallery_media(id)')
      .order('display_order', { ascending: true });
    if (error) {
      setGalleries([]);
      return;
    }
    const rows = (data || []) as Record<string, unknown>[];
    setGalleries(rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      description: (r.description as string | null) ?? null,
      cover_image_url: (r.cover_image_url as string | null) ?? null,
      external_cover_asset_id: (r.external_cover_asset_id as string | null | undefined) ?? null,
      display_order: (r.display_order as number | undefined) ?? 0,
      status: (r.status as GalleryStatus | undefined) ?? 'published',
      is_featured: Boolean(r.is_featured),
      theme: (r.theme as string | null | undefined) ?? null,
      gallery_media: (r.gallery_media as { id: string }[] | undefined) ?? [],
    })));
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          theme: theme.trim() || null,
          is_featured: featured,
          status: 'draft',
        }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setName('');
      setDescription('');
      setTheme('');
      setFeatured(false);
      await load();
      showToast('success', 'Story created as draft');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/galleries?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const d = await res.json();
      showToast('error', (d.error as string) || 'Delete failed');
      return;
    }
    await load();
    showToast('success', 'Collection deleted');
  };

  const openEdit = (g: GalleryRow) => {
    setEditingGallery(g);
    setEditName(g.name);
    setEditDescription(g.description ?? '');
    setEditTheme(g.theme ?? '');
    setEditFeatured(Boolean(g.is_featured));
    setEditStatus((g.status as GalleryStatus) ?? 'draft');
    setCoverPickerOpen(false);
  };

  const closeEdit = () => {
    setEditingGallery(null);
    setCoverPickerOpen(false);
    setAddMediaPickerOpen(false);
    setGalleryMediaDetail([]);
  };

  const loadGalleryMediaDetail = useCallback(async (galleryId: string) => {
    setLoadingMediaDetail(true);
    try {
      const { data: mediaRows } = await supabase
        .from('gallery_media')
        .select('id, url, thumbnail_url, external_media_asset_id, media_type, caption, display_order')
        .eq('gallery_id', galleryId)
        .order('display_order', { ascending: true });
      if (!mediaRows?.length) {
        setGalleryMediaDetail(mediaRows ? mediaRows.map((m: { id: string; url?: string | null; thumbnail_url?: string | null; media_type?: string; caption?: string | null; display_order?: number }) => ({
          id: m.id,
          preview_url: (m.url || m.thumbnail_url) ?? null,
          media_type: m.media_type || 'image',
          caption: m.caption ?? null,
          display_order: m.display_order ?? 0,
        })) : []);
        return;
      }
      const assetIds = (mediaRows as { external_media_asset_id?: string | null }[])
        .map((m) => m.external_media_asset_id)
        .filter((id): id is string => !!id);
      let previewByAssetId: Record<string, string> = {};
      if (assetIds.length > 0) {
        const { data: assets } = await supabase
          .from('external_media_assets')
          .select('id, preview_url')
          .in('id', assetIds);
        if (assets) {
          for (const a of assets as { id: string; preview_url: string }[]) {
            previewByAssetId[a.id] = a.preview_url || '';
          }
        }
      }
      const items: GalleryMediaItem[] = (mediaRows as { id: string; url?: string | null; thumbnail_url?: string | null; external_media_asset_id?: string | null; media_type?: string; caption?: string | null; display_order?: number }[]).map((m) => ({
        id: m.id,
        preview_url: previewByAssetId[m.external_media_asset_id!] ?? m.url ?? m.thumbnail_url ?? null,
        media_type: m.media_type || 'image',
        caption: m.caption ?? null,
        display_order: m.display_order ?? 0,
      }));
      setGalleryMediaDetail(items);
    } finally {
      setLoadingMediaDetail(false);
    }
  }, [supabase]);

  // Load full gallery_media with preview URLs when editing
  useEffect(() => {
    if (!editingGallery?.id) {
      setGalleryMediaDetail([]);
      return;
    }
    loadGalleryMediaDetail(editingGallery.id);
  }, [editingGallery?.id, loadGalleryMediaDetail]);

  const handleRemoveMediaFromCollection = useCallback(async (galleryMediaId: string) => {
    if (!editingGallery) return;
    try {
      const res = await fetch(`/api/admin/gallery-media?id=${encodeURIComponent(galleryMediaId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const d = await res.json();
        showToast('error', (d?.error as string) || 'Failed to remove');
        return;
      }
      setGalleryMediaDetail((prev) => prev.filter((m) => m.id !== galleryMediaId));
      setEditingGallery((prev) => prev ? { ...prev, gallery_media: (prev.gallery_media || []).filter((gm) => gm.id !== galleryMediaId) } : null);
      load();
      showToast('success', 'Item removed from collection');
    } catch {
      showToast('error', 'Failed to remove item');
    }
  }, [editingGallery, load, showToast]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: editingGallery.id,
          name: editName.trim(),
          description: editDescription.trim() || null,
          theme: editTheme.trim() || null,
          is_featured: editFeatured,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
      closeEdit();
      showToast('success', 'Collection updated');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSetCover = (asset: { id: string; preview_url: string }) => {
    if (!editingGallery) return;
    fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: editingGallery.id,
        cover_url: asset.preview_url,
        cover_external_asset_id: asset.id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setEditingGallery((prev) => prev ? { ...prev, cover_image_url: asset.preview_url } : null);
          load();
          showToast('success', 'Cover image set');
        } else showToast('error', (data.error as string) || 'Failed');
      })
      .catch(() => showToast('error', 'Failed to set cover'));
    setCoverPickerOpen(false);
  };

  const handleClearCover = () => {
    if (!editingGallery) return;
    fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id: editingGallery.id, clear_cover: true }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setEditingGallery((prev) => prev ? { ...prev, cover_image_url: null, external_cover_asset_id: null } : null);
          load();
          showToast('success', 'Cover cleared');
        } else showToast('error', (data.error as string) || 'Failed');
      })
      .catch(() => showToast('error', 'Failed to clear cover'));
  };

  const handleAddMediaToCollection = (asset: { id: string; preview_url: string; mime_type?: string | null }) => {
    if (!editingGallery) return;
    setAddingMedia(true);
    const mediaType = (asset.mime_type || '').startsWith('video/') ? 'video' : 'image';
    fetch('/api/admin/gallery-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        gallery_id: editingGallery.id,
        media_type: mediaType,
        url: asset.preview_url,
        external_media_asset_id: asset.id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error && data.media?.id) {
          const newId = data.media.id as string;
          setGalleryMediaDetail((prev) => [...prev, { id: newId, preview_url: asset.preview_url, media_type: mediaType, caption: null, display_order: prev.length }]);
          setEditingGallery((prev) => prev ? { ...prev, gallery_media: [...(prev.gallery_media || []), { id: newId }] } : null);
          load();
          showToast('success', 'Media added to collection');
        } else showToast('error', (data.error as string) || 'Failed to add media');
      })
      .catch(() => showToast('error', 'Failed to add media'))
      .finally(() => {
        setAddingMedia(false);
        setAddMediaPickerOpen(false);
      });
  };

  const moveStory = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= galleries.length) return;
    const a = galleries[index];
    const b = galleries[target];
    if (!a || !b) return;
    const res = await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        items: [
          { id: a.id, display_order: target },
          { id: b.id, display_order: index },
        ],
      }),
    });
    if (!res.ok) {
      showToast('error', 'Reorder failed');
      return;
    }
    await load();
  };

  const moveMedia = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= galleryMediaDetail.length) return;
    const next = [...galleryMediaDetail];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    const items = next.map((m, i) => ({ id: m.id, display_order: i }));
    setGalleryMediaDetail(next.map((m, i) => ({ ...m, display_order: i })));
    const res = await fetch('/api/admin/gallery-media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ items }),
    });
    if (!res.ok) showToast('error', 'Could not reorder frames');
  };

  const saveCaption = async (id: string, caption: string) => {
    setGalleryMediaDetail((prev) => prev.map((m) => (m.id === id ? { ...m, caption } : m)));
    const res = await fetch('/api/admin/gallery-media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, caption }),
    });
    if (!res.ok) showToast('error', 'Could not save caption');
  };

  return (
    <AdminPage title="Collections" subtitle="Curated visual stories on /collections. Unpublished and empty stories stay hidden.">
      <AdminCard className="mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Story title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Title of the story"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Theme (optional)</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Festival, Studio, On the road"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Editorial intro (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short intro that frames the story"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Feature this story on the Collections hub
          </label>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add story (draft)'}
          </button>
        </form>
      </AdminCard>

      <p className="text-sm text-slate-600 mb-4">
        New stories start as drafts. Publish only when the title, intro, cover, and frames are ready. Empty or unpublished stories do not appear on the public site.
      </p>

      <div className="space-y-3">
        {galleries.map((g, index) => (
          <AdminCard key={g.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {g.cover_image_url ? (
                <img
                  src={g.cover_image_url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
                  No cover
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 truncate">{g.name}</p>
                  {g.is_featured && (
                    <span className="px-2 py-0.5 text-xs rounded bg-violet-500/20 text-violet-700">Featured</span>
                  )}
                  {g.status === 'published' ? (
                    <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-700">Published</span>
                  ) : g.status ? (
                    <span className={`px-2 py-0.5 text-xs rounded ${g.status === 'draft' ? 'bg-amber-500/20 text-amber-700' : 'bg-slate-500/20 text-slate-600'}`}>
                      {g.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">{g.theme ? `${g.theme} · ` : ''}{g.slug}</p>
                <p className="text-xs text-slate-500">
                  {(g.gallery_media?.length ?? 0)} frames
                  {g.slug ? (
                    <> · <a href={`/collections/${g.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View on site</a></>
                  ) : (
                    <> · <span className="text-slate-400">No slug</span></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveStory(index, 'up')}
                disabled={index === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveStory(index, 'down')}
                disabled={index === galleries.length - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openEdit(g)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(g.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </AdminCard>
        ))}
      </div>

      {editingGallery && (
        <div className="admin-modal-backdrop" onClick={closeEdit}>
          <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header flex items-center justify-between">
              <div>
                <span className="font-medium">Edit story</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingGallery.gallery_media?.length ?? 0} frames
                  {' · '}
                  {editStatus === 'published' ? 'Visible on Collections' : editStatus === 'draft' ? 'Draft (hidden)' : 'Archived (hidden)'}
                  {editingGallery.cover_image_url ? ' · Cover set' : ' · No cover'}
                  {editFeatured ? ' · Featured' : ''}
                </p>
              </div>
              <button type="button" onClick={closeEdit} className="p-1 rounded hover:bg-slate-200" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form id="edit-gallery-form" onSubmit={handleSaveEdit} className="admin-modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Story title</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Theme (optional)</label>
                <input
                  type="text"
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  placeholder="Chapter or theme label"
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Editorial intro (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editFeatured}
                  onChange={(e) => setEditFeatured(e.target.checked)}
                />
                Feature this story on the Collections hub
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as GalleryStatus)}
                  className="admin-input w-full px-3 py-2"
                >
                  <option value="published">Published (visible on Collections)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Only published stories with at least one frame appear on the public site.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover image</label>
                <p className="text-xs text-slate-500 mb-2">Shown as the story cover. Choose from library or clear.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {editingGallery.cover_image_url ? (
                    <img src={editingGallery.cover_image_url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  {coverPickerOpen ? (
                    <MediaLibraryPicker
                      open={true}
                      onClose={() => setCoverPickerOpen(false)}
                      onSelect={handleSetCover}
                      filter="image"
                      title="Choose cover image"
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCoverPickerOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                      >
                        Choose from library
                      </button>
                      {editingGallery.cover_image_url && (
                        <button
                          type="button"
                          onClick={handleClearCover}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-sm font-medium"
                        >
                          Clear cover
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Story frames</label>
                <p className="text-xs text-slate-500 mb-2">
                  {(editingGallery.gallery_media?.length ?? 0)} frames. Add from library, caption, reorder, or remove.
                </p>
                {loadingMediaDetail ? (
                  <p className="text-sm text-slate-500">Loading items…</p>
                ) : galleryMediaDetail.length > 0 ? (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      {galleryMediaDetail.map((item, mediaIndex) => (
                        <div
                          key={item.id}
                          className="relative group flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2 pr-10"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveMedia(mediaIndex, 'up')}
                              disabled={mediaIndex === 0}
                              className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMedia(mediaIndex, 'down')}
                              disabled={mediaIndex === galleryMediaDetail.length - 1}
                              className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-slate-200">
                            <MediaThumb
                              src={item.preview_url}
                              isImage={item.media_type === 'image'}
                              alt=""
                              posterUrl={item.media_type === 'video' ? item.preview_url : null}
                              className="!aspect-square w-full h-full rounded-none"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-slate-600 capitalize">{item.media_type}</span>
                            <input
                              type="text"
                              defaultValue={item.caption ?? ''}
                              placeholder="Caption (optional)"
                              className="mt-1 w-full px-2 py-1 text-sm border border-slate-200 rounded"
                              onBlur={(e) => {
                                const next = e.target.value;
                                if (next !== (item.caption ?? '')) saveCaption(item.id, next);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaFromCollection(item.id)}
                            className="absolute right-2 top-3 p-1.5 rounded text-red-600 hover:bg-red-50"
                            title="Remove from story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {!addMediaPickerOpen && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAddMediaPickerOpen(true)}
                          disabled={addingMedia}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                        >
                          {addingMedia ? 'Adding…' : 'Add from library'}
                        </button>
                        <UniversalUploader
                          multiple
                          acceptedTypes={['image', 'video']}
                          onSelected={async (files: UploadedFile[]) => {
                            if (!editingGallery || files.length === 0) return;
                            setAddingMedia(true);
                            try {
                              for (const file of files) {
                                const mediaType = (file.mimeType || '').startsWith('video/') ? 'video' : 'image';
                                const res = await fetch('/api/admin/gallery-media', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'same-origin',
                                  body: JSON.stringify({
                                    gallery_id: editingGallery.id,
                                    media_type: mediaType,
                                    url: file.url,
                                    external_media_asset_id: file.id,
                                  }),
                                });
                                if (!res.ok) {
                                  const d = await res.json().catch(() => ({}));
                                  showToast('error', (d.error as string) || 'Failed to add media');
                                }
                              }
                              await loadGalleryMediaDetail(editingGallery.id);
                              await load();
                              showToast('success', `Added ${files.length} item${files.length > 1 ? 's' : ''}`);
                            } finally {
                              setAddingMedia(false);
                            }
                          }}
                          buttonLabel="Upload directly"
                          className="mt-0"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  !addMediaPickerOpen && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAddMediaPickerOpen(true)}
                        disabled={addingMedia}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                      >
                        {addingMedia ? 'Adding…' : 'Add from library'}
                      </button>
                      <UniversalUploader
                        multiple
                        acceptedTypes={['image', 'video']}
                        onSelected={async (files: UploadedFile[]) => {
                          if (!editingGallery || files.length === 0) return;
                          setAddingMedia(true);
                          try {
                            for (const file of files) {
                              const mediaType = (file.mimeType || '').startsWith('video/') ? 'video' : 'image';
                              const res = await fetch('/api/admin/gallery-media', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'same-origin',
                                body: JSON.stringify({
                                  gallery_id: editingGallery.id,
                                  media_type: mediaType,
                                  url: file.url,
                                  external_media_asset_id: file.id,
                                }),
                              });
                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                showToast('error', (d.error as string) || 'Failed to add media');
                              }
                            }
                            await loadGalleryMediaDetail(editingGallery.id);
                            await load();
                            showToast('success', `Added ${files.length} item${files.length > 1 ? 's' : ''}`);
                          } finally {
                            setAddingMedia(false);
                          }
                        }}
                        buttonLabel="Upload directly"
                        className="mt-0"
                      />
                    </div>
                  )
                )}
                {addMediaPickerOpen && (
                  <MediaLibraryPicker
                    open={true}
                    onClose={() => setAddMediaPickerOpen(false)}
                    onSelect={handleAddMediaToCollection}
                    title="Add media to collection"
                  />
                )}
              </div>
            </form>
            <div className="admin-modal-footer">
              <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                form="edit-gallery-form"
                disabled={savingEdit}
                className="admin-btn-primary px-4 py-2 rounded-lg text-white disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {galleries.length === 0 && (
        <AdminCard>
          <p className="text-slate-500 text-center py-6">No stories yet. Add one above — it will stay draft until you publish.</p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
