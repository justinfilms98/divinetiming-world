'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { motion, AnimatePresence } from 'framer-motion';
import type { Gallery, GalleryMedia } from '@/lib/types/content';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
}

interface MediaPageClientProps {
  galleries: (Gallery & { gallery_media: GalleryMedia[] })[];
  videos: Video[];
  headline: string;
  subtext?: string | null;
  showHeadline?: boolean;
}

function GalleryView({
  gallery,
  onBack,
  onMediaClick,
}: {
  gallery: Gallery & { gallery_media: GalleryMedia[] };
  onBack: () => void;
  onMediaClick: (url: string, mediaType: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors"
      >
        ← Back to Galleries
      </button>
      <h2 className="text-2xl font-bold text-white mb-6">{gallery.name}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.gallery_media.map((item) => (
          <button
            key={item.id}
            onClick={() => onMediaClick(item.url, item.media_type)}
            className="relative aspect-square bg-white/5 rounded-lg overflow-hidden group border border-white/10"
          >
            {item.media_type === 'image' ? (
              <Image
                src={item.thumbnail_url || item.url}
                alt={item.caption || 'Media'}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-white text-4xl">▶</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MediaLightbox({
  url,
  mediaType,
  onClose,
}: {
  url: string;
  mediaType: string;
  onClose: () => void;
}) {
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl hover:text-[var(--accent)] transition-colors z-10"
        >
          ×
        </button>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-7xl max-h-full w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {mediaType === 'video' ? (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="max-w-full max-h-[90vh]"
            />
          ) : (
            <Image
              src={url}
              alt="Media"
              width={1200}
              height={1200}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="max-w-full max-h-[90vh] object-contain"
            />
          )}
        </motion.div>
      </motion.div>
  );
}

export function MediaPageClient({
  galleries,
  videos,
  headline,
  subtext,
  showHeadline = true,
}: MediaPageClientProps) {
  const [activeTab, setActiveTab] = useState<'galleries' | 'videos'>('galleries');
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; mediaType: string } | null>(null);

  const selectedGalleryData = galleries.find((g) => g.id === selectedGallery);

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <GlassPanel className="max-w-6xl w-full">
        {showHeadline && (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center tracking-tight">
              {headline.toUpperCase()}
            </h1>
            {subtext && (
              <p className="text-white/70 text-center mb-8">{subtext}</p>
            )}
          </>
        )}

        {/* Tabs */}
        <div className={`flex justify-center gap-4 mb-8 ${!showHeadline ? 'mt-0' : ''}`}>
          <button
            onClick={() => {
              setActiveTab('galleries');
              setSelectedGallery(null);
            }}
            className={`px-6 py-2 rounded-md transition-colors font-medium ${
              activeTab === 'galleries'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Galleries
          </button>
          <button
            onClick={() => {
              setActiveTab('videos');
              setSelectedGallery(null);
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
        {activeTab === 'galleries' ? (
          selectedGalleryData ? (
            <GalleryView
              gallery={selectedGalleryData}
              onBack={() => setSelectedGallery(null)}
              onMediaClick={(url, mediaType) => setLightboxMedia({ url, mediaType })}
            />
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
                hidden: {},
              }}
            >
              {galleries.map((gallery, i) => (
                <motion.button
                  key={gallery.id}
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 20 },
                  }}
                  onClick={() =>
                    gallery.gallery_media?.length
                      ? setSelectedGallery(gallery.id)
                      : null
                  }
                  className="text-left group"
                >
                  <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-300">
                    {gallery.cover_image_url ? (
                      <Image
                        src={gallery.cover_image_url}
                        alt={gallery.name}
                        fill
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-white font-semibold">{gallery.name}</div>
                  {gallery.description && (
                    <div className="text-white/70 text-sm mt-1">{gallery.description}</div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
              >
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.title}
                    loading="lazy"
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

      <AnimatePresence>
        {lightboxMedia && (
          <MediaLightbox
            key="lightbox"
            url={lightboxMedia.url}
            mediaType={lightboxMedia.mediaType}
            onClose={() => setLightboxMedia(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
