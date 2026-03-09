'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { createClient } from '@/lib/supabase/client';
import { X, ImageIcon } from 'lucide-react';

interface GalleryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  external_cover_asset_id?: string | null;
  display_order: number;
  gallery_media?: { id: string }[];
}

export default function AdminCollectionsPage() {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addMediaPickerOpen, setAddMediaPickerOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('galleries')
      .select('id, name, slug, description, cover_image_url, external_cover_asset_id, display_order, gallery_media(id)')
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create collection');
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
      alert(d.error || 'Delete failed');
      return;
    }
    await load();
  };

  const openEdit = (g: GalleryRow) => {
    setEditingGallery(g);
    setEditName(g.name);
    setEditDescription(g.description ?? '');
    setCoverPickerOpen(false);
  };

  const closeEdit = () => {
    setEditingGallery(null);
    setCoverPickerOpen(false);
  };

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
      closeEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
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
        } else alert(data.error);
      })
      .catch(() => alert('Failed to set cover'));
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
        } else alert(data.error);
      })
      .catch(() => alert('Failed to clear cover'));
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
        if (!data.error) {
          load();
          setEditingGallery((prev) => prev ? { ...prev, gallery_media: [...(prev.gallery_media || []), { id: (data.media as { id: string })?.id }] } : null);
        } else alert(data.error || 'Failed to add media');
      })
      .catch(() => alert('Failed to add media'))
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
        Set a cover image so it appears on the public Media page. Add photos via Media library and gallery-media API.
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
                <p className="font-medium text-slate-800 truncate">{g.name}</p>
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
              <span>Edit collection</span>
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
                <p className="text-xs text-slate-500 mb-2">{(editingGallery.gallery_media?.length ?? 0)} items. Add photos or videos from the library.</p>
                {addMediaPickerOpen ? (
                  <MediaLibraryPicker
                    open={true}
                    onClose={() => setAddMediaPickerOpen(false)}
                    onSelect={handleAddMediaToCollection}
                    title="Add media to collection"
                  />
                ) : (
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
