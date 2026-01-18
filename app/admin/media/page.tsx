'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, Image as ImageIcon, Video, Trash2, Film } from 'lucide-react';

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'albums'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    if (activeTab === 'videos') {
      const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
      setVideos(data || []);
    } else {
      const { data } = await supabase.from('photo_albums').select('*').order('display_order');
      setAlbums(data || []);
    }
    setIsLoading(false);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    await supabase.from('videos').insert({
      title: formData.get('title') as string,
      youtube_id: formData.get('youtube_id') as string,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      is_featured: formData.get('is_featured') === 'on',
    });
    await loadData();
    (e.target as HTMLFormElement).reset();
    setShowVideoForm(false);
    alert('Video added successfully!');
  };

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    await supabase.from('photo_albums').insert({
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      cover_image_url: formData.get('cover_image_url') as string || null,
    });
    await loadData();
    (e.target as HTMLFormElement).reset();
    setShowAlbumForm(false);
    alert('Album created successfully!');
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('videos').delete().eq('id', id);
    await loadData();
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Delete this album? All photos will be deleted.')) return;
    await supabase.from('photo_albums').delete().eq('id', id);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Media" description="Manage videos and photo albums" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Media"
        description="Manage videos and photo galleries"
        actions={
          <button
            onClick={() => (activeTab === 'videos' ? setShowVideoForm(true) : setShowAlbumForm(true))}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'videos' ? 'Add Video' : 'Create Album'}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'videos'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'albums'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Photo Albums
        </button>
      </div>

      {/* Video Form */}
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
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">YouTube ID</label>
              <input
                type="text"
                name="youtube_id"
                required
                placeholder="dQw4w9WgXcQ"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
              <p className="text-white/50 text-xs mt-1">Just the video ID, not the full URL</p>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail URL (optional)</label>
              <input
                type="url"
                name="thumbnail_url"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_featured" id="video_featured" className="w-4 h-4" />
              <label htmlFor="video_featured" className="text-white/70 text-sm">
                Feature on homepage
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
              >
                Add Video
              </button>
              <button
                type="button"
                onClick={() => setShowVideoForm(false)}
                className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Album Form */}
      {showAlbumForm && (
        <AdminCard className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create Photo Album</h2>
          <form onSubmit={handleAddAlbum} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Description (optional)</label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Cover Image URL (optional)</label>
              <input
                type="url"
                name="cover_image_url"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
              >
                Create Album
              </button>
              <button
                type="button"
                onClick={() => setShowAlbumForm(false)}
                className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Content */}
      {activeTab === 'videos' ? (
        videos.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={Video}
              title="No videos yet"
              description="Add your first video to start building your media library."
              action={
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
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
                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {video.is_featured && (
                  <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                    Featured
                  </span>
                )}
              </AdminCard>
            ))}
          </div>
        )
      ) : (
        albums.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={ImageIcon}
              title="No albums yet"
              description="Create your first photo album to organize your gallery."
              action={
                <button
                  onClick={() => setShowAlbumForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Album
                </button>
              }
            />
          </AdminCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {albums.map((album) => (
              <AdminCard key={album.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{album.title}</h3>
                    {album.description && <p className="text-white/50 text-sm">{album.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteAlbum(album.id)}
                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </AdminCard>
            ))}
          </div>
        )
      )}
    </>
  );
}
