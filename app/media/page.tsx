'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GlassPanel } from '@/components/ui/GlassPanel';
import Image from 'next/image';

function AlbumView({
  albumId,
  albums,
  onBack,
  onPhotoClick,
}: {
  albumId: string;
  albums: any[];
  onBack: () => void;
  onPhotoClick: (url: string) => void;
}) {
  const [photos, setPhotos] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('display_order')
      .then(({ data }) => setPhotos(data || []));
  }, [albumId, supabase]);

  const album = albums.find((a) => a.id === albumId);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors"
      >
        ← Back to Albums
      </button>
      <h2 className="text-2xl font-bold text-white mb-6">{album?.title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => onPhotoClick(photo.image_url)}
            className="relative aspect-square bg-white/5 rounded-lg overflow-hidden group border border-white/10"
          >
            <Image
              src={photo.thumbnail_url || photo.image_url}
              alt={photo.alt_text || 'Photo'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PhotoLightbox({ photoUrl, onClose }: { photoUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-[var(--accent)] transition-colors"
      >
        ×
      </button>
      <div className="relative max-w-7xl max-h-full">
        <Image
          src={photoUrl}
          alt="Photo"
          width={1200}
          height={1200}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [albums, setAlbums] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (activeTab === 'photos') {
      supabase
        .from('photo_albums')
        .select('*')
        .order('display_order')
        .then(({ data }) => setAlbums(data || []));
    } else {
      supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setVideos(data || []));
    }
  }, [activeTab, supabase]);

  const handleAlbumClick = async (albumId: string) => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('display_order');

    if (data && data.length > 0) {
      setSelectedAlbum(albumId);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <GlassPanel className="max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center tracking-tight">
          MEDIA
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setActiveTab('photos');
              setSelectedAlbum(null);
            }}
            className={`px-6 py-2 rounded-md transition-colors font-medium ${
              activeTab === 'photos'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => {
              setActiveTab('videos');
              setSelectedAlbum(null);
            }}
            className={`px-6 py-2 rounded-md transition-colors font-medium ${
              activeTab === 'videos'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Videos
          </button>
        </div>

        {/* Content */}
        {activeTab === 'photos' ? (
          selectedAlbum ? (
            <AlbumView
              albumId={selectedAlbum}
              albums={albums}
              onBack={() => setSelectedAlbum(null)}
              onPhotoClick={setSelectedPhoto}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => handleAlbumClick(album.id)}
                  className="text-left group"
                >
                  <div className="relative aspect-square bg-white/5 rounded-lg overflow-hidden mb-4 border border-white/10">
                    {album.cover_image_url ? (
                      <Image
                        src={album.cover_image_url}
                        alt={album.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-white font-semibold">{album.title}</div>
                  {album.description && (
                    <div className="text-white/70 text-sm mt-1">{album.description}</div>
                  )}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <div className="text-white font-semibold">{video.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
