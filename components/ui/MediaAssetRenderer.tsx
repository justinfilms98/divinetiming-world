'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { SpiralLoader } from '@/components/brand/SpiralLoader';
import { isOptimizableImageUrl } from '@/lib/media/imageHosts';

interface MediaAssetRendererProps {
  url: string | null;
  mediaType: 'image' | 'video' | string | null;
  alt?: string;
  className?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain';
  /** CSS object-position for cropped media, e.g. '50% 30%'. Defaults to centre. */
  objectPosition?: string;
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
  /**
   * Hero video only. false = keep the element ready (metadata preloaded) but paused,
   * e.g. the next carousel slide or a paused slideshow. Default true.
   */
  playing?: boolean;
  /** Hero video only. Default true; carousels turn it off so `onEnded` can advance. */
  loop?: boolean;
  onEnded?: () => void;
  /** Hero video only: buffering exceeded the stall timeout while playing. */
  onStalled?: () => void;
  /** Hero video only: each new value rewinds the clip to its start (a slide re-entering the carousel). */
  restartToken?: number;
}

const STALL_TIMEOUT_MS = 8000;

/** Retry muted autoplay — mobile Safari often needs an explicit play() call. */
function useMutedAutoplay(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  url: string | null,
  shouldPlay: boolean,
  onStalled?: () => void
) {
  const onStalledRef = useRef(onStalled);
  useEffect(() => {
    onStalledRef.current = onStalled;
  }, [onStalled]);
  const shouldPlayRef = useRef(shouldPlay);
  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
  }, [shouldPlay]);

  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [buffering, setBuffering] = useState(true);
  // Slow networks can stall indefinitely; stop the spinner and fall back to the poster.
  const [stalled, setStalled] = useState(false);

  const attemptPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !url) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('x5-playsinline', '');
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        setNeedsTap(true);
        setBuffering(false);
      });
    }
  }, [videoRef, url]);

  useEffect(() => {
    // A paused/standby video is not "stalled" however long it waits.
    if (!buffering || !shouldPlay) return;
    const timer = window.setTimeout(() => {
      setStalled(true);
      onStalledRef.current?.();
    }, STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [buffering, shouldPlay]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url) return;
    if (!shouldPlay) {
      v.pause();
      return;
    }
    attemptPlay();
    const raf = requestAnimationFrame(() => attemptPlay());
    const timer = window.setTimeout(() => {
      if (v.paused && !v.ended) {
        setNeedsTap(true);
        setBuffering(false);
      }
    }, 1200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [url, attemptPlay, videoRef, shouldPlay]);

  const onPlaying = useCallback(() => {
    setPlaying(true);
    setNeedsTap(false);
    setBuffering(false);
    setStalled(false);
  }, []);

  const onWaiting = useCallback(() => {
    setBuffering(true);
  }, []);

  const onCanPlay = useCallback(() => {
    setBuffering(false);
    setStalled(false);
    if (shouldPlayRef.current) attemptPlay();
  }, [attemptPlay]);

  const onTapPlay = useCallback(() => {
    attemptPlay();
    setNeedsTap(false);
  }, [attemptPlay]);

  return { playing, needsTap, buffering, stalled, attemptPlay, onPlaying, onWaiting, onCanPlay, onTapPlay };
}

interface HeroAutoplayVideoProps {
  url: string;
  posterUrl?: string | null;
  className?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain';
  objectPosition?: string;
  priority?: boolean;
  onError?: () => void;
  playing?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onStalled?: () => void;
  restartToken?: number;
}

function BufferedVideo({
  url,
  posterUrl,
  className = '',
  fill = false,
  objectFit = 'cover',
  onError,
}: {
  url: string;
  posterUrl?: string | null;
  className?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain';
  onError?: () => void;
}) {
  const [buffering, setBuffering] = useState(true);

  return (
    <div className={fill ? 'absolute inset-0' : 'relative w-full h-full'}>
      {/* key forces a fresh element when the URL changes (HTMLMediaElement quirk). */}
      <video
        key={url}
        src={url}
        controls
        playsInline
        preload="metadata"
        poster={posterUrl ?? undefined}
        className={`w-full h-full ${className}`}
        style={fill ? { position: 'absolute', inset: 0, objectFit } : undefined}
        onError={onError}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onLoadedData={() => setBuffering(false)}
      />
      <div className="spiral-buffer" data-visible={buffering ? 'true' : 'false'}>
        <SpiralLoader size="md" variant="spin" label="Buffering video" />
      </div>
    </div>
  );
}

function HeroAutoplayVideo({
  url,
  posterUrl = null,
  className = '',
  fill = true,
  objectFit = 'cover',
  objectPosition,
  onError,
  playing: playingProp,
  loop = true,
  onEnded,
  onStalled,
  restartToken,
}: HeroAutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldPlay = playingProp !== false;
  useEffect(() => {
    const v = videoRef.current;
    if (v && restartToken != null && v.currentTime > 0) v.currentTime = 0;
  }, [restartToken]);
  const { playing, needsTap, buffering, stalled, attemptPlay, onPlaying, onWaiting, onCanPlay, onTapPlay } =
    useMutedAutoplay(videoRef, url, shouldPlay, onStalled);
  const maybePlay = () => {
    if (shouldPlay) attemptPlay();
  };

  return (
    <div className={fill ? 'absolute inset-0' : 'relative w-full h-full'}>
      <video
        ref={videoRef}
        key={url}
        src={url}
        autoPlay={shouldPlay}
        loop={loop}
        muted
        playsInline
        webkit-playsinline=""
        x5-playsinline=""
        // Standby slides (next in the carousel) fetch metadata only; the showing slide downloads.
        preload={shouldPlay ? 'auto' : 'metadata'}
        poster={posterUrl ?? undefined}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        className={`hero-autoplay-video w-full h-full ${className}`}
        style={fill ? { position: 'absolute', inset: 0, objectFit, objectPosition } : { objectFit, objectPosition }}
        onError={onError}
        onLoadedMetadata={maybePlay}
        onLoadedData={maybePlay}
        onCanPlay={onCanPlay}
        onCanPlayThrough={onCanPlay}
        onPlaying={onPlaying}
        onWaiting={onWaiting}
        onEnded={onEnded}
      />
      {posterUrl && (!playing || stalled) && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden
          className={`pointer-events-none z-[1] w-full h-full object-cover ${fill ? 'absolute inset-0' : ''}`}
          style={{ objectPosition }}
        />
      )}
      <div className="spiral-buffer" data-visible={shouldPlay && buffering && !needsTap && !stalled ? 'true' : 'false'}>
        <SpiralLoader size="md" variant="spin" label="Buffering video" />
      </div>
      {shouldPlay && needsTap && (
        <button
          type="button"
          onClick={onTapPlay}
          className="absolute inset-0 z-[2] flex items-center justify-center bg-black/20 pointer-events-auto"
          aria-label="Play video"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 ring-2 ring-white/40">
            <svg className="ml-1 h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
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

/**
 * Keyed by URL so a carousel advancing to a different source remounts cleanly
 * (fresh error/buffer state) instead of resetting state inside effects.
 */
export function MediaAssetRenderer(props: MediaAssetRendererProps) {
  return <MediaAssetRendererInner key={props.url ?? 'none'} {...props} />;
}

function MediaAssetRendererInner({
  url,
  mediaType,
  alt = '',
  className = '',
  fill = true,
  objectFit = 'cover',
  objectPosition,
  priority = false,
  sizes = '100vw',
  onError,
  provider: providerProp,
  controls = false,
  fallback = HeroEclipseFallback,
  errorFallback = MediaUnavailableFallback,
  poster: posterUrl = null,
  playing,
  loop,
  onEnded,
  onStalled,
  restartToken,
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
      return (
        <BufferedVideo
          url={url}
          posterUrl={posterUrl}
          className={className}
          fill={fill}
          objectFit={objectFit}
          onError={handleError}
        />
      );
    }
    return (
      <HeroAutoplayVideo
        url={url}
        posterUrl={posterUrl}
        className={className}
        fill={fill}
        objectFit={objectFit}
        objectPosition={objectPosition}
        priority={priority}
        onError={handleError}
        playing={playing}
        loop={loop}
        onEnded={onEnded}
        onStalled={onStalled}
        restartToken={restartToken}
      />
    );
  }

  if (effectiveType === 'image') {
    if (fill && isOptimizableImageUrl(url)) {
      return (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={80}
          className={`${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
          style={{ objectPosition }}
          onError={handleError}
        />
      );
    }
    return (
      <img
        src={url}
        alt={alt}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
        style={fill ? { position: 'absolute', inset: 0, objectPosition } : { objectPosition }}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        onError={handleError}
      />
    );
  }

  return <>{fallback}</>;
}
