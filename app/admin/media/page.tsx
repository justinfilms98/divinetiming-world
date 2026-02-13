'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import {
  Plus,
  Image as ImageIcon,
  Video,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react';
import { compressMedia } from '@/lib/utils/compressMedia';
import { revalidateAfterSave } from '@/lib/revalidate';
import type { Gallery, GalleryMedia } from '@/lib/types/content';
import Image from 'next/image';

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

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'galleries'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<GalleryWithMedia[]>([]);
  const [expandedGalleryId, setExpandedGalleryId] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalGallery, setMediaModalGallery] = useState<GalleryWithMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'videos') {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      setVideos(data || []);
    } else {
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
    }
  };

  const toggleGallery = (id: string) => {
    setExpandedGalleryId((prev) => (prev === id ? null : id));
  };

  const openAddMedia = (gallery: GalleryWithMedia) => {
    setMediaModalGallery(gallery);
    setShowMediaModal(true);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const maxOrder = videos.length > 0 ? Math.max(...videos.map((v: any) => v.display_order ?? 0)) : -1;
    await supabase.from('videos').insert({
      title: formData.get('title') as string,
      youtube_id: formData.get('youtube_id') as string,
      thumbnail_url: (formData.get('thumbnail_url') as string) || null,
      is_featured: formData.get('is_featured') === 'on',
      display_order: maxOrder + 1,
    });
    await loadData();
    await revalidateAfterSave('media');
    (e.target as HTMLFormElement).reset();
    setShowVideoForm(false);
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('title') as string;
    let slug = slugify(name) || `gallery-${Date.now()}`;
    const { data: existing } = await supabase.from('galleries').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-6)}`;

    const maxOrder = galleries.length > 0 ? Math.max(...galleries.map((g) => g.display_order ?? 0)) : -1;
    const { error } = await supabase.from('galleries').insert({
      name,
      slug,
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      display_order: maxOrder + 1,
    });
    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }
    await loadData();
    await revalidateAfterSave('media');
    (e.target as HTMLFormElement).reset();
    setShowGalleryForm(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mediaModalGallery) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Please upload an image or video.');
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressMedia(file);
      const ext = compressed.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
      const path = `gallery-media/${mediaModalGallery.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('media').upload(path, compressed, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const order = mediaModalGallery.gallery_media?.length ?? 0;

      await supabase.from('gallery_media').insert({
        gallery_id: mediaModalGallery.id,
        media_type: isImage ? 'image' : 'video',
        url: urlData.publicUrl,
        thumbnail_url: isImage ? urlData.publicUrl : null,
        display_order: order,
      });

      await loadData();
      await revalidateAfterSave('media');
      const updated = (await supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery.id).single()).data;
      if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

    const order = mediaModalGallery.gallery_media?.length ?? 0;
    await supabase.from('gallery_media').insert({
      gallery_id: mediaModalGallery.id,
      media_type: mediaType,
      url,
      thumbnail_url: (formData.get('thumbnail_url') as string) || null,
      caption: (formData.get('caption') as string) || null,
      display_order: order,
    });
    await loadData();
    await revalidateAfterSave('media');
    const updated = (await supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery.id).single()).data;
    if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('videos').delete().eq('id', id);
    await loadData();
    await revalidateAfterSave('media');
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this gallery? All media will be deleted.')) return;
    await supabase.from('galleries').delete().eq('id', id);
    setExpandedGalleryId((prev) => (prev === id ? null : prev));
    await loadData();
    await revalidateAfterSave('media');
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Remove this media from the gallery?')) return;
    await supabase.from('gallery_media').delete().eq('id', id);
    await loadData();
    await revalidateAfterSave('media');
    if (mediaModalGallery) {
      const updated = (await supabase.from('galleries').select('*, gallery_media(*)').eq('id', mediaModalGallery.id).single()).data;
      if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    }
  };

  const handleMoveGallery = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= galleries.length) return;
    const a = galleries[index];
    const b = galleries[target];
    await supabase.from('galleries').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('galleries').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    await loadData();
    await revalidateAfterSave('media');
  };

  const handleMoveMedia = async (gallery: GalleryWithMedia, index: number, direction: 'up' | 'down') => {
    const items = gallery.gallery_media || [];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await supabase.from('gallery_media').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('gallery_media').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    await loadData();
    await revalidateAfterSave('media');
    if (mediaModalGallery?.id === gallery.id) {
      const updated = (await supabase.from('galleries').select('*, gallery_media(*)').eq('id', gallery.id).single()).data;
      if (updated) setMediaModalGallery(updated as GalleryWithMedia);
    }
  };

  return (
    <>
      <PageHeader
        title="Media"
        description="Manage videos and galleries"
        actions={
          <button
            onClick={() => (activeTab === 'videos' ? setShowVideoForm(true) : setShowGalleryForm(true))}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'videos' ? 'Add Video' : 'Create Gallery'}
          </button>
        }
      />

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'videos' ? 'bg-[var(--accent)] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('galleries')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'galleries' ? 'bg-[var(--accent)] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Galleries
        </button>
      </div>

      {/* Add Video Form */}
      {showVideoForm && (
        <AdminCard className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add Video</h2>
          <form onSubmit={handleAddVideo} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">YouTube ID</label>
              <input
                type="text"
                name="youtube_id"
                required
                placeholder="dQw4w9WgXcQ"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail URL (optional)</label>
              <input type="url" name="thumbnail_url" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_featured" id="video_featured" className="w-4 h-4" />
              <label htmlFor="video_featured" className="text-white/70 text-sm">Feature on homepage</label>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium">
                Add Video
              </button>
              <button type="button" onClick={() => setShowVideoForm(false)} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Create Gallery Form */}
      {showGalleryForm && (
        <AdminCard className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create Gallery</h2>
          <form onSubmit={handleAddGallery} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Name</label>
              <input type="text" name="title" required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Description (optional)</label>
              <textarea name="description" rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Cover Image URL (optional)</label>
              <input type="url" name="cover_image_url" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium">
                Create Gallery
              </button>
              <button type="button" onClick={() => setShowGalleryForm(false)} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        videos.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={Video}
              title="No videos yet"
              description="Add your first video to start building your media library."
              action={
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Video
                </button>
              }
            />
          </AdminCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <AdminCard key={video.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{video.title}</h3>
                    <p className="text-white/50 text-sm">YouTube ID: {video.youtube_id}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {video.is_featured && (
                  <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">Featured</span>
                )}
              </AdminCard>
            ))}
          </div>
        )
      )}

      {/* Galleries Tab - Expandable */}
      {activeTab === 'galleries' && (
        galleries.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={ImageIcon}
              title="No galleries yet"
              description="Create your first gallery to organize photos and videos."
              action={
                <button
                  onClick={() => setShowGalleryForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Gallery
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
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveGallery(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move gallery up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveGallery(index, 'down');
                        }}
                        disabled={index === galleries.length - 1}
                        className="p-1 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move gallery down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    {gallery.cover_image_url ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        <Image src={gallery.cover_image_url} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{gallery.name}</h3>
                      <p className="text-white/50 text-sm">
                        {gallery.gallery_media?.length ?? 0} items · {gallery.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddMedia(gallery);
                      }}
                      className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg"
                      title="Add media"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGallery(gallery.id);
                      }}
                      className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight
                      className={`w-5 h-5 text-white/50 transition-transform ${expandedGalleryId === gallery.id ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>

                {expandedGalleryId === gallery.id && (
                  <div className="border-t border-white/10 p-4 bg-black/20">
                    {gallery.gallery_media?.length === 0 ? (
                      <EmptyState
                        icon={ImageIcon}
                        title="No media yet"
                        description="Upload images or videos, or add by URL."
                        action={
                          <button
                            onClick={() => openAddMedia(gallery)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            Add Media
                          </button>
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.gallery_media?.map((item, i) => (
                          <div key={item.id} className="flex flex-col">
                            <AdminCard className="p-4 flex-1">
                              <div className="aspect-square bg-white/5 rounded-lg overflow-hidden mb-3 relative">
                                {item.media_type === 'image' ? (
                                  <Image
                                    src={item.thumbnail_url || item.url}
                                    alt={item.caption || 'Media'}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-black/50">
                                    <span className="text-white text-4xl">▶</span>
                                  </div>
                                )}
                              </div>
                              {item.caption && (
                                <p className="text-white/70 text-sm truncate mb-2">{item.caption}</p>
                              )}
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => handleMoveMedia(gallery, i, 'up')}
                                    disabled={i === 0}
                                    className="p-1 text-white/50 hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveMedia(gallery, i, 'down')}
                                    disabled={i === (gallery.gallery_media?.length ?? 0) - 1}
                                    className="p-1 text-white/50 hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDeleteMedia(item.id)}
                                  className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </AdminCard>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={() => openAddMedia(gallery)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4" />
                        Add Media
                      </button>
                    </div>
                  </div>
                )}
              </AdminCard>
            ))}
          </div>
        )
      )}

      {/* Add Media Modal */}
      {showMediaModal && mediaModalGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMediaModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0c10] z-10">
              <h2 className="text-xl font-semibold text-white">Add Media to {mediaModalGallery.name}</h2>
              <button onClick={() => setShowMediaModal(false)} className="p-2 text-white/70 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Upload file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="media-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-white/20 rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload image or video'}
                </label>
              </div>
              <div className="text-white/50 text-sm text-center">— or add by URL —</div>
              <form onSubmit={handleAddMediaUrl} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Type</label>
                  <select
                    name="media_type"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">URL</label>
                  <input
                    type="url"
                    name="url"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail URL (optional)</label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Caption (optional)</label>
                  <input
                    type="text"
                    name="caption"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium">
                  Add by URL
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
