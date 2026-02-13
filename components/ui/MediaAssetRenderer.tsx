'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const BLUR_PLACEHOLDER =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEAAhEAL/2gAMAwEAAhEDEQA/AL8A/9k=';

interface MediaAssetRendererProps {
  url: string | null;
  mediaType: 'image' | 'video' | string | null;
  alt?: string;
  className?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain';
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
  /** Fallback when no media URL (e.g. default hero) */
  fallback?: React.ReactNode;
  /** Fallback when media fails to load (e.g. Drive inaccessible). Defaults to MediaUnavailableFallback */
  errorFallback?: React.ReactNode;
}

/** Default fallback when media fails to load (e.g. Drive inaccessible) */
export const MediaUnavailableFallback = (
  <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a0f1f] to-[#0f0c10] flex items-center justify-center">
    <div className="text-center px-4">
      <p className="text-white/50 text-sm">Media unavailable</p>
      <p className="text-white/30 text-xs mt-1">The file may have been moved or access changed</p>
    </div>
  </div>
);

/** Eclipse-style fallback for hero sections when no media or default */
export const HeroEclipseFallback = (
  <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a0f1f] to-[#0f0c10]">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-96 h-96 rounded-full bg-gradient-radial from-[var(--accent)]/20 via-transparent to-transparent blur-3xl" />
    </div>
  </div>
);

const DEFAULT_FALLBACK = MediaUnavailableFallback;

export function MediaAssetRenderer({
  url,
  mediaType,
  alt = '',
  className = '',
  fill = true,
  objectFit = 'cover',
  priority = false,
  sizes = '100vw',
  onError,
  fallback = HeroEclipseFallback,
  errorFallback = MediaUnavailableFallback,
}: MediaAssetRendererProps) {
  const [hasError, setHasError] = useState(false);
  const [driveHealthChecked, setDriveHealthChecked] = useState(false);
  const [driveInaccessible, setDriveInaccessible] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const effectiveType = mediaType === 'image' || mediaType === 'video' ? mediaType : null;
  const isDriveVideo = effectiveType === 'video' && url?.includes('drive.google.com');

  // Health-check for Drive videos (iframe has no onError)
  useEffect(() => {
    if (!isDriveVideo || !url) return;
    let cancelled = false;
    fetch('/api/integrations/google-drive/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && !data.accessible) setDriveInaccessible(true);
      })
      .catch(() => {
        if (!cancelled) setDriveInaccessible(true);
      })
      .finally(() => {
        if (!cancelled) setDriveHealthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isDriveVideo, url]);

  if (!url || !effectiveType) {
    return <>{fallback}</>;
  }
  if (hasError) {
    return <>{errorFallback}</>;
  }
  if (isDriveVideo && driveHealthChecked && driveInaccessible) {
    return <>{errorFallback}</>;
  }

  const isDriveImage = effectiveType === 'image' && url.includes('drive.google.com');

  // Video: native for uploads, iframe for Google Drive
  if (effectiveType === 'video') {
    if (isDriveVideo) {
      return (
        <iframe
          src={url}
          className={`w-full h-full pointer-events-none ${className}`}
          style={fill ? { position: 'absolute', inset: 0 } : undefined}
          allow="autoplay"
          title={alt || 'Video'}
        />
      );
    }
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full ${className}`}
        style={fill ? { position: 'absolute', inset: 0, objectFit } : undefined}
        onError={handleError}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
      </video>
    );
  }

  // Image: Next.js Image for non-Drive, img for Drive (avoids domain config)
  if (effectiveType === 'image') {
    if (isDriveImage) {
      return (
        <img
          src={url}
          alt={alt}
          className={`w-full h-full ${className}`}
          style={fill ? { position: 'absolute', inset: 0, objectFit } : undefined}
          onError={handleError}
        />
      );
    }
    return (
      <Image
        src={url}
        alt={alt}
        fill={fill}
        className={`${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  return <>{fallback}</>;
}
