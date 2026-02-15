'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageShell } from '@/components/layout/PageShell';
import { AdminCard } from '@/components/admin/AdminCard';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { Uploader, type ExternalMediaAsset } from '@/components/admin/Uploader';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';
import {
  Plus,
  Image as ImageIcon,
  Video,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { revalidateAfterSave } from '@/lib/revalidate';
import type { Gallery, GalleryMedia } from '@/lib/types/content';
import Image from 'next/image';

type Tab = 'library' | 'galleries' | 'videos';
type LibraryFilter = 'all' | 'image' | 'video';

/** Library asset from DB or from upload (ExternalMediaAsset + created_at from API) */
type LibraryAsset = ExternalMediaAsset & { created_at?: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface GalleryWithMedia extends Gallery {
  gallery_media: GalleryMedia[];
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<GalleryWithMedia[]>([]);
  const [expandedGalleryId, setExpandedGalleryId] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalGallery, setMediaModalGallery] = useState<GalleryWithMedia | null>(null);
  const supabase = createClient();

  const loadLibrary = useCallback(async () => {
    const { data } = await supabase
      .from('external_media_assets')
      .select('id, provider, file_id, preview_url, thumbnail_url, mime_type, size_bytes, name, created_at')
      .order('created_at', { ascending: false });
    setLibraryAssets((data || []) as LibraryAsset[]);
  }, [supabase]);

  const loadVideos = useCallback(async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    setVideos(data || []);
  }, [supabase]);

  const loadGalleries = useCallback(async () => {
    const { data } = await supabase
      .from('galleries')
      .select('*, gallery_media(*)')
      .order('display_order', { ascending: true });
    const sorted = (data || []).map((g: any) => ({
      ...g,
      gallery_media: (g.gallery_media || []).sort(
        (a: GalleryMedia, b: GalleryMedia) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    }));
    setGalleries(sorted);
  }, [supabase]);

  useEffect(() => {
    if (activeTab === 'library') loadLibrary();
    if (activeTab === 'videos') loadVideos();
    if (activeTab === 'galleries') loadGalleries();
  }, [activeTab, loadLibrary, loadVideos, loadGalleries]);

  const filteredLibrary = libraryAssets.filter((a) => {
    if (libraryFilter === 'image' && !(a.mime_type || '').startsWith('image/')) return false;
    if (libraryFilter === 'video' && !(a.mime_type || '').startsWith('video/')) return false;
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      return (a.name || a.file_id || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleLibraryUpload = (assets: ExternalMediaAsset[]) => {
    const withCreatedAt = (assets || []).map((a) => ({ ...a, created_at: new Date().toISOString() }));
    setLibraryAssets((prev) => [...withCreatedAt, ...prev]);
    setSelectedAsset(withCreatedAt[0] ?? null);
  };

  const handleCopyUrl = async () => {
    const url = selectedAsset?.preview_url;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset || !confirm('Remove this asset from the library?')) return;
    const res = await fetch(`/api/admin/media-library?id=${encodeURIComponent(selectedAsset.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    setLibraryAssets((prev) => prev.filter((a) => a.id !== selectedAsset.id));
    setSelectedAsset(null);
  };

  const toggleGallery = (id: string) => {
    setExpandedGalleryId((prev) => (prev === id ? null : id));
  };

  const openAddMedia = (gallery: GalleryWithMedia) => {
    setMediaModalGallery(gallery);
    setShowMediaModal(true);
  };

  const handleMediaFromLibrary = (asset: ExternalMediaAsset) => {
    if (!mediaModalGallery) return;
    const mediaType = (asset.mime_type || '').startsWith('video/') ? 'video' : 'image';
    fetch('/api/admin/gallery-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        gallery_id: mediaModalGallery.id,
        media_type: mediaType,
        url: asset.preview_url,
        thumbnail_url: asset.thumbnail_url || asset.preview_url,
        external_media_asset_id: asset.id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          alert('Error: ' + data.error);
          return;
        }
        loadGalleries();
        revalidateAfterSave('media');
        supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery!.id).single().then(({ data: d }) => {
          if (d) setMediaModalGallery(d as GalleryWithMedia);
        });
      });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        title: formData.get('title'),
        youtube_id: formData.get('youtube_id'),
        thumbnail_url: (formData.get('thumbnail_url') as string) || null,
        is_featured: formData.get('is_featured') === 'on',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadVideos();
    await revalidateAfterSave('media');
    (e.target as HTMLFormElement).reset();
    setShowVideoForm(false);
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('title') as string;
    const res = await fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        name,
        description: (formData.get('description') as string) || null,
        cover_url: (formData.get('cover_url') as string) || null,
        cover_external_asset_id: (formData.get('cover_external_asset_id') as string) || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadGalleries();
    await revalidateAfterSave('media');
    (e.target as HTMLFormElement).reset();
    setShowGalleryForm(false);
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    const res = await fetch(`/api/admin/videos?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadVideos();
    await revalidateAfterSave('media');
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this gallery? All media will be deleted.')) return;
    const res = await fetch(`/api/admin/galleries?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    setExpandedGalleryId((prev) => (prev === id ? null : prev));
    await loadGalleries();
    await revalidateAfterSave('media');
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Remove this media from the gallery?')) return;
    const res = await fetch(`/api/admin/gallery-media?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadGalleries();
    await revalidateAfterSave('media');
    if (mediaModalGallery) {
      const { data: updated } = await supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery.id).single();
      if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    }
  };

  const handleMoveGallery = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= galleries.length) return;
    const a = galleries[index];
    const b = galleries[target];
    const res = await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ swap: [a, b] }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadGalleries();
    await revalidateAfterSave('media');
  };

  const handleMoveMedia = async (gallery: GalleryWithMedia, index: number, direction: 'up' | 'down') => {
    const items = gallery.gallery_media || [];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    const res = await fetch('/api/admin/gallery-media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ items: [a, b] }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadGalleries();
    if (mediaModalGallery?.id === gallery.id) {
      const { data: updated } = await supabase.from('galleries').select('*, gallery_media(*)').eq('id', gallery.id).single();
      if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    }
  };

  const handleAddMediaUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaModalGallery) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get('url') as string;
    let mediaType = formData.get('media_type') as 'image' | 'video';
    if (!url) return;
    if (url.includes('youtube.com') || url.includes('youtu.be')) mediaType = 'video';
    const res = await fetch('/api/admin/gallery-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        gallery_id: mediaModalGallery.id,
        media_type: mediaType,
        url,
        thumbnail_url: (formData.get('thumbnail_url') as string) || null,
        caption: (formData.get('caption') as string) || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadGalleries();
    await revalidateAfterSave('media');
    const { data: updated } = await supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery.id).single();
    if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    (e.target as HTMLFormElement).reset();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'galleries', label: 'Galleries' },
    { id: 'videos', label: 'Videos' },
  ];

  return (
    <PageShell
      title="Media"
      subtitle="Library, galleries, and videos"
      actions={
        activeTab === 'library' ? (
          <Uploader
            multiple
            onSelected={handleLibraryUpload}
            buttonLabel="Upload"
            className="inline-flex"
          />
        ) : (
          <LuxuryButton
            onClick={() => (activeTab === 'videos' ? setShowVideoForm(true) : setShowGalleryForm(true))}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'videos' ? 'Add Video' : 'Create Gallery'}
          </LuxuryButton>
        )
      }
    >
      <div className="flex gap-4 mb-6 border-b border-white/10">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2.5 rounded-t-lg font-medium transition-colors ${
              activeTab === id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="flex gap-6">
          <div className={`flex-1 min-w-0 ${selectedAsset ? 'lg:max-w-[calc(100%-320px)]' : ''}`}>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                {(['all', 'image', 'video'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLibraryFilter(f)}
                    className={`px-4 py-2 text-sm font-medium capitalize ${
                      libraryFilter === f ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
                  </button>
                ))}
              </div>
              <input
                type="search"
                placeholder="Search by name…"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 w-48"
              />
            </div>
            {filteredLibrary.length === 0 ? (
              <AdminCard>
                <EmptyState
                  icon={ImageIcon}
                  title="No media in library"
                  description="Upload images or videos to reuse across heroes, events, and galleries."
                  action={
                    <Uploader
                      multiple
                      onSelected={handleLibraryUpload}
                      buttonLabel="Upload Media"
                    />
                  }
                />
              </AdminCard>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredLibrary.map((asset) => {
                  const isImage = (asset.mime_type || '').startsWith('image/');
                  const thumbUrl = asset.thumbnail_url || asset.preview_url;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors text-left ${
                        selectedAsset?.id === asset.id
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {thumbUrl ? (
                        isImage ? (
                          <Image
                            src={thumbUrl}
                            alt={asset.name || ''}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Video className="w-10 h-10 text-white/70" />
                          </div>
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <ImageIcon className="w-10 h-10 text-white/30" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {selectedAsset && (
            <AdminCard className="w-full lg:w-80 flex-shrink-0 h-fit sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 text-white/50 hover:text-white rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-4">
                {(selectedAsset.mime_type || '').startsWith('video/') ? (
                  <MediaAssetRenderer
                    url={selectedAsset.preview_url}
                    mediaType="video"
                    controls
                    fill={false}
                    className="w-full h-full object-contain"
                  />
                ) : selectedAsset.preview_url ? (
                  <Image
                    src={selectedAsset.preview_url}
                    alt={selectedAsset.name || ''}
                    fill
                    className="object-contain"
                    sizes="320px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/30" />
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-white/60">
                  <span className="text-white/40">Type:</span>{' '}
                  {(selectedAsset.mime_type || '—').split('/')[0]}
                </p>
                <p className="text-white/60">
                  <span className="text-white/40">Size:</span> {formatSize(selectedAsset.size_bytes)}
                </p>
                {selectedAsset.name && (
                  <p className="text-white/60 truncate" title={selectedAsset.name}>
                    <span className="text-white/40">Name:</span> {selectedAsset.name}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 hover:bg-white/10 text-sm"
                >
                  {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedUrl ? 'Copied' : 'Copy URL'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAsset}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-red-400/90 hover:bg-red-500/10 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from library
                </button>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* Galleries Tab */}
      {activeTab === 'galleries' && (
        <>
          {showGalleryForm && (
            <AdminCard className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Create Gallery</h2>
              <form onSubmit={handleAddGallery} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Name</label>
                  <input type="text" name="title" required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Description (optional)</label>
                  <textarea name="description" rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Cover image (optional)</label>
                  <Uploader
                    multiple={false}
                    onSelected={(assets) => {
                      const a = assets[0];
                      if (a) {
                        (document.querySelector('input[name="cover_external_asset_id"]') as HTMLInputElement).value = a.id;
                        (document.querySelector('input[name="cover_url"]') as HTMLInputElement).value = a.preview_url;
                      }
                    }}
                    buttonLabel="Upload cover image"
                  />
                  <input type="hidden" name="cover_external_asset_id" />
                  <input type="hidden" name="cover_url" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-medium">Create</button>
                  <button type="button" onClick={() => setShowGalleryForm(false)} className="px-6 py-2 bg-white/5 text-white rounded-lg">Cancel</button>
                </div>
              </form>
            </AdminCard>
          )}
          {galleries.length === 0 && !showGalleryForm ? (
            <AdminCard>
              <EmptyState
                icon={ImageIcon}
                title="No galleries yet"
                description="Create a gallery to organize photos and videos."
                action={
                  <button onClick={() => setShowGalleryForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium">
                    <Plus className="w-4 h-4" /> Create Gallery
                  </button>
                }
              />
            </AdminCard>
          ) : (
            <div className="space-y-2">
              {galleries.map((gallery, index) => (
                <AdminCard key={gallery.id} className="p-0 overflow-hidden">
                  <button
                    onClick={() => toggleGallery(gallery.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveGallery(index, 'up'); }} disabled={index === 0} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveGallery(index, 'down'); }} disabled={index === galleries.length - 1} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      {gallery.cover_image_url ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          <Image src={gallery.cover_image_url} alt="" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-white/30" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{gallery.name}</h3>
                        <p className="text-white/50 text-sm">{gallery.gallery_media?.length ?? 0} items · {gallery.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); openAddMedia(gallery); }} className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg" title="Add media">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteGallery(gallery.id); }} className="p-2 text-red-400/70 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className={`w-5 h-5 text-white/50 ${expandedGalleryId === gallery.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  {expandedGalleryId === gallery.id && (
                    <div className="border-t border-white/10 p-4 bg-black/20">
                      {gallery.gallery_media?.length === 0 ? (
                        <p className="text-white/50 text-sm mb-4">No media. Add images or videos.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                          {gallery.gallery_media?.map((item, i) => (
                            <div key={item.id} className="flex flex-col">
                              <div className="aspect-square rounded-lg overflow-hidden bg-white/5 relative mb-2">
                                {item.media_type === 'image' ? (
                                  <Image src={item.thumbnail_url || item.url} alt={item.caption || ''} fill className="object-cover" sizes="200px" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><span className="text-white text-2xl">▶</span></div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleMoveMedia(gallery, i, 'up')} disabled={i === 0} className="p-1 text-white/50 hover:text-white disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                <button type="button" onClick={() => handleMoveMedia(gallery, i, 'down')} disabled={i === (gallery.gallery_media?.length ?? 0) - 1} className="p-1 text-white/50 hover:text-white disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                <button type="button" onClick={() => handleDeleteMedia(item.id)} className="p-2 text-red-400/70 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => openAddMedia(gallery)} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 text-sm">
                        <Plus className="w-4 h-4" /> Add Media
                      </button>
                    </div>
                  )}
                </AdminCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <>
          {showVideoForm && (
            <AdminCard className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Add Video</h2>
              <form onSubmit={handleAddVideo} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Title</label>
                  <input type="text" name="title" required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">YouTube ID</label>
                  <input type="text" name="youtube_id" required placeholder="dQw4w9WgXcQ" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Thumbnail URL (optional)</label>
                  <input type="url" name="thumbnail_url" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_featured" className="w-4 h-4" />
                  <span className="text-white/70 text-sm">Feature on homepage</span>
                </label>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-medium">Add Video</button>
                  <button type="button" onClick={() => setShowVideoForm(false)} className="px-6 py-2 bg-white/5 text-white rounded-lg">Cancel</button>
                </div>
              </form>
            </AdminCard>
          )}
          {videos.length === 0 && !showVideoForm ? (
            <AdminCard>
              <EmptyState
                icon={Video}
                title="No videos yet"
                description="Add YouTube videos for the media page."
                action={
                  <button onClick={() => setShowVideoForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium">
                    <Plus className="w-4 h-4" /> Add Video
                  </button>
                }
              />
            </AdminCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((video) => (
                <AdminCard key={video.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{video.title}</h3>
                      <p className="text-white/50 text-sm">YouTube ID: {video.youtube_id}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteVideo(video.id)} className="p-2 text-red-400/70 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {video.is_featured && <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">Featured</span>}
                </AdminCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Media to Gallery Modal */}
      {showMediaModal && mediaModalGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMediaModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl">
            <div className="sticky top-0 flex justify-between p-4 border-b border-white/10 bg-[#0f0c10] z-10">
              <h2 className="text-xl font-semibold text-white">Add media to {mediaModalGallery.name}</h2>
              <button onClick={() => setShowMediaModal(false)} className="p-2 text-white/70 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Upload file</label>
                <Uploader
                  multiple
                  onSelected={(assets) => {
                    assets.forEach((a) => handleMediaFromLibrary(a));
                  }}
                  buttonLabel="Upload image or video"
                />
              </div>
              <p className="text-white/50 text-sm text-center">— or add by URL —</p>
              <form onSubmit={handleAddMediaUrl} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Type</label>
                  <select name="media_type" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">URL</label>
                  <input type="url" name="url" placeholder="https://..." className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Thumbnail URL (optional)</label>
                  <input type="url" name="thumbnail_url" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Caption (optional)</label>
                  <input type="text" name="caption" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-medium">Add by URL</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
