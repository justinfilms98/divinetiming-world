'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { createClient } from '@/lib/supabase/client';
import { X, ImageIcon, Trash2 } from 'lucide-react';
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
  gallery_media?: { id: string }[];
}

/** Loaded in edit modal: gallery_media row id + resolved preview for display */
interface GalleryMediaItem {
  id: string;
  preview_url: string | null;
  media_type: string;
}

export default function AdminCollectionsPage() {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<GalleryStatus>('published');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addMediaPickerOpen, setAddMediaPickerOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const [galleryMediaDetail, setGalleryMediaDetail] = useState<GalleryMediaItem[]>([]);
  const [loadingMediaDetail, setLoadingMediaDetail] = useState(false);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('galleries')
      .select('id, name, slug, description, cover_image_url, external_cover_asset_id, display_order, status, gallery_media(id)')
      .order('display_order', { ascending: true });
    setGalleries((data || []) as GalleryRow[]);
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
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setName('');
      setDescription('');
      await load();
      showToast('success', 'Collection created');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection and all its photos?')) return;
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
    setEditStatus((g.status as GalleryStatus) ?? 'published');
    setCoverPickerOpen(false);
  };

  const closeEdit = () => {
    setEditingGallery(null);
    setCoverPickerOpen(false);
    setAddMediaPickerOpen(false);
    setGalleryMediaDetail([]);
  };

  // Load full gallery_media with preview URLs when editing
  useEffect(() => {
    if (!editingGallery?.id) {
      setGalleryMediaDetail([]);
      return;
    }
    let cancelled = false;
    setLoadingMediaDetail(true);
    (async () => {
      try {
        const { data: mediaRows } = await supabase
          .from('gallery_media')
          .select('id, url, thumbnail_url, external_media_asset_id, media_type')
          .eq('gallery_id', editingGallery.id)
          .order('display_order', { ascending: true });
        if (cancelled || !mediaRows?.length) {
          if (!cancelled) setGalleryMediaDetail(mediaRows ? mediaRows.map((m: { id: string; url?: string | null; thumbnail_url?: string | null; media_type?: string }) => ({
            id: m.id,
            preview_url: (m.url || m.thumbnail_url) ?? null,
            media_type: m.media_type || 'image',
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
        const items: GalleryMediaItem[] = (mediaRows as { id: string; url?: string | null; thumbnail_url?: string | null; external_media_asset_id?: string | null; media_type?: string }[]).map((m) => ({
          id: m.id,
          preview_url: previewByAssetId[m.external_media_asset_id!] ?? m.url ?? m.thumbnail_url ?? null,
          media_type: m.media_type || 'image',
        }));
        if (!cancelled) setGalleryMediaDetail(items);
      } finally {
        if (!cancelled) setLoadingMediaDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editingGallery?.id, supabase]);

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
          setGalleryMediaDetail((prev) => [...prev, { id: newId, preview_url: asset.preview_url, media_type: mediaType }]);
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

  return (
    <AdminPage title="Collections" subtitle="Galleries shown on the public Media page (Collections tab)">
      <AdminCard className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elefantum24"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add collection'}
          </button>
        </form>
      </AdminCard>

      <p className="text-sm text-slate-600 mb-4">
        Set a cover image for each collection so it appears on the public Media page. Add photos by editing a collection and choosing from the media library.
      </p>

      <div className="space-y-3">
        {galleries.map((g) => (
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
                  {g.status === 'published' ? (
                    <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-700">Published</span>
                  ) : (g.status && g.status !== 'published') ? (
                    <span className={`px-2 py-0.5 text-xs rounded ${g.status === 'draft' ? 'bg-amber-500/20 text-amber-700' : 'bg-slate-500/20 text-slate-600'}`}>
                      {g.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">{g.slug}</p>
                <p className="text-xs text-slate-500">
                  {(g.gallery_media?.length ?? 0)} items
                  {g.slug ? (
                    <> · <a href={`/media/galleries/${g.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View on site</a></>
                  ) : (
                    <> · <span className="text-slate-400">No slug</span></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <span className="font-medium">Edit collection</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingGallery.gallery_media?.length ?? 0} items
                  {' · '}
                  {editStatus === 'published' ? 'Visible on Media page' : editStatus === 'draft' ? 'Draft (hidden)' : 'Archived (hidden)'}
                  {editingGallery.cover_image_url ? ' · Cover set' : ' · No cover'}
                </p>
              </div>
              <button type="button" onClick={closeEdit} className="p-1 rounded hover:bg-slate-200" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form id="edit-gallery-form" onSubmit={handleSaveEdit} className="admin-modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as GalleryStatus)}
                  className="admin-input w-full px-3 py-2"
                >
                  <option value="published">Published (visible on Media page)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Only published collections appear on the public Media page.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover image</label>
                <p className="text-xs text-slate-500 mb-2">Shown on the public Media page. Choose from library or clear.</p>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Media in collection</label>
                <p className="text-xs text-slate-500 mb-2">
                  {(editingGallery.gallery_media?.length ?? 0)} items. Add from library or remove below.
                </p>
                {loadingMediaDetail ? (
                  <p className="text-sm text-slate-500">Loading items…</p>
                ) : galleryMediaDetail.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {galleryMediaDetail.map((item) => (
                        <div
                          key={item.id}
                          className="relative group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2 pr-10"
                        >
                          <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-slate-200">
                            <MediaThumb
                              src={item.preview_url}
                              isImage={item.media_type === 'image'}
                              alt=""
                              posterUrl={item.media_type === 'video' ? item.preview_url : null}
                              className="!aspect-square w-full h-full rounded-none"
                            />
                          </div>
                          <span className="text-xs text-slate-600 capitalize">{item.media_type}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaFromCollection(item.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-red-600 hover:bg-red-50"
                            title="Remove from collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {!addMediaPickerOpen && (
                      <button
                        type="button"
                        onClick={() => setAddMediaPickerOpen(true)}
                        disabled={addingMedia}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                      >
                        {addingMedia ? 'Adding…' : 'Add from library'}
                      </button>
                    )}
                  </div>
                ) : (
                  !addMediaPickerOpen && (
                    <button
                      type="button"
                      onClick={() => setAddMediaPickerOpen(true)}
                      disabled={addingMedia}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                    >
                      {addingMedia ? 'Adding…' : 'Add from library'}
                    </button>
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
          <p className="text-slate-500 text-center py-6">No collections yet. Add one above.</p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
