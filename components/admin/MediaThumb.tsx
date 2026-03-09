'use client';

import { useState } from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';

interface MediaThumbProps {
  /** Resolved display URL (preview or thumbnail). */
  src: string | null;
  /** Whether this asset is an image (else video). */
  isImage: boolean;
  alt?: string;
  /** Optional poster URL for video (thumbnail). */
  posterUrl?: string | null;
  className?: string;
}

/**
 * Admin media thumbnail: real preview when possible, neutral fallback on error or missing.
 * No broken image icons. Use in media library grid and picker.
 */
export function MediaThumb({ src, isImage, alt = '', posterUrl, className = '' }: MediaThumbProps) {
  const [error, setError] = useState(false);
  const displayUrl = (isImage ? src : posterUrl || src) || '';
  const showImg = displayUrl && (isImage || posterUrl) && !error;

  return (
    <div className={`aspect-square relative bg-slate-100 rounded-lg overflow-hidden ${className}`}>
      {showImg ? (
        <>
          <img
            src={displayUrl}
            alt={alt}
            className="w-full h-full object-cover absolute inset-0"
            onError={() => setError(true)}
          />
          {!isImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <Video className="w-10 h-10 text-white/90 drop-shadow" />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          {isImage ? (
            <ImageIcon className="w-10 h-10 text-slate-400" aria-hidden />
          ) : (
            <Video className="w-10 h-10 text-slate-400" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
