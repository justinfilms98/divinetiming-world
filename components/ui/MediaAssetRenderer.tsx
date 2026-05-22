'use client';

import { useState, useEffect } from 'react';

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
  /** Optional: 'uploadcare' | 'google_drive' - detected from URL if not set */
  provider?: 'uploadcare' | 'google_drive' | string | null;
  /** For video: show controls (play/pause, volume). Default false for hero-style autoplay. */
  controls?: boolean;
  /** Fallback when no media URL (e.g. default hero) */
  fallback?: React.ReactNode;
  /** Fallback when media fails to load (e.g. Drive inaccessible). Defaults to MediaUnavailableFallback */
  errorFallback?: React.ReactNode;
  /** For video: poster image URL to show before play (improves LCP and perceived load) */
  poster?: string | null;
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
  provider: providerProp,
  controls = false,
  fallback = HeroEclipseFallback,
  errorFallback = MediaUnavailableFallback,
  poster: posterUrl = null,
}: MediaAssetRendererProps) {
  const [hasError, setHasError] = useState(false);
  const [driveHealthChecked, setDriveHealthChecked] = useState(false);
  const [driveInaccessible, setDriveInaccessible] = useState(false);

  // Reset error state when the source changes (e.g. carousel advances to a
  // different slot). Without this, one broken slide kills every subsequent
  // slide in the carousel.
  useEffect(() => {
    setHasError(false);
    setDriveHealthChecked(false);
    setDriveInaccessible(false);
  }, [url]);

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
  if (hasError) return <>{errorFallback}</>;
  if (isDriveVideo && driveHealthChecked && driveInaccessible) return <>{errorFallback}</>;

  // Video: native for uploadcare + direct URLs, iframe for Google Drive
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
    if (controls) {
      // `key={url}` forces React to mount a fresh <video> element when the URL
      // changes — without it, browsers do not reload the source on src change
      // (a known HTMLMediaElement quirk).
      return (
        <video
          key={url}
          src={url}
          controls
          playsInline
          preload="metadata"
          className={`w-full h-full ${className}`}
          style={fill ? { position: 'absolute', inset: 0, objectFit } : undefined}
          onError={handleError}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
        </video>
      );
    }
    return (
      <video
        key={url}
        src={url}
        autoPlay
        loop
        muted
        defaultMuted
        playsInline
        // @ts-expect-error legacy iOS attribute, still required on older Safari
        webkit-playsinline=""
        // @ts-expect-error needed for iOS 10+ to actually start muted before user gesture
        x5-playsinline=""
        preload={posterUrl ? 'metadata' : 'auto'}
        poster={posterUrl ?? undefined}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        className={`w-full h-full ${className}`}
        style={fill ? { position: 'absolute', inset: 0, objectFit } : undefined}
        onError={handleError}
        onLoadedMetadata={(e) => {
          // Some mobile browsers refuse the initial autoplay attempt; calling
          // play() explicitly with the element already muted often succeeds.
          const v = e.currentTarget;
          v.muted = true;
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
      </video>
    );
  }

  // Image: direct CDN rendering (no proxy). Native <img> for Uploadcare + Drive.
  // Phase 29A: Never use /image?url= proxy. Uploadcare CDN is public, fast, cached.
  if (effectiveType === 'image') {
    return (
      <img
        src={url}
        alt={alt}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        onError={handleError}
      />
    );
  }

  return <>{fallback}</>;
}
