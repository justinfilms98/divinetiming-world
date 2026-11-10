'use client';

import { useState } from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { AdminImage } from '@/components/admin/AdminImage';
import { isVideoUrl } from '@/lib/media/mediaUrls';

interface MediaThumbProps {
  /** Resolved display URL (preview or thumbnail). */
  src: string | null;
  /** Whether this asset is an image (else video). */
  isImage: boolean;
  alt?: string;
  /** Optional poster URL for video (thumbnail). Ignored if it is itself a video file. */
  posterUrl?: string | null;
  className?: string;
  /** Rendered tile width hint for the image optimizer. */
  sizes?: string;
}

/**
 * Admin media thumbnail: a resized copy of the image (never the full original), a video's poster
 * if it has one, otherwise a neutral icon. Video files are never loaded as images.
 */
export function MediaThumb({
  src,
  isImage,
  alt = '',
  posterUrl,
  className = '',
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px',
}: MediaThumbProps) {
  const [error, setError] = useState(false);
  const imageUrl = isImage ? src : posterUrl;
  const showImg = !!imageUrl && !isVideoUrl(imageUrl) && !error;

  return (
    <div className={`aspect-square relative bg-white/[0.06] rounded-lg overflow-hidden ${className}`}>
      {showImg ? (
        <>
          <AdminImage src={imageUrl} alt={alt} sizes={sizes} onError={() => setError(true)} />
          {!isImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <Video className="w-7 h-7 sm:w-10 sm:h-10 text-white/90 drop-shadow" />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.06]">
          {isImage ? (
            <ImageIcon className="w-7 h-7 sm:w-10 sm:h-10 text-white/30" aria-hidden />
          ) : (
            <Video className="w-7 h-7 sm:w-10 sm:h-10 text-white/30" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
