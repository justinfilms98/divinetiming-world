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
  /**
   * Hero video only: when the connection can't keep up, hold the clip once until the browser
   * reports it can play through, instead of stuttering through repeated buffering.
   */
  holdUntilPlayable?: boolean;
}

const STALL_TIMEOUT_MS = 8000;
// A deliberate hold (slow connection) gets longer before the carousel gives up on the slide.
const HOLD_TIMEOUT_MS = 15000;

/** Retry muted autoplay — mobile Safari often needs an explicit play() call. */
function useMutedAutoplay(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  url: string | null,
  shouldPlay: boolean,
  onStalled?: () => void,
  holdUntilPlayable = false
) {
  // play() is always called first (iOS Safari only buffers after it); the hold pauses on the
  // first `waiting` and resumes on `canplaythrough`.
  const holdingRef = useRef(false);
  const [holding, setHolding] = useState(false);
  // Marks pauses we cause, so a pause the browser makes on its own (power saving, background
  // media policies) can be told apart and recovered from.
  const selfPauseRef = useRef(false);
  const resumeTriesRef = useRef(0);
  // Only a clip that was actually playing counts as "paused by the browser"; a clip whose
  // autoplay was refused is handled by the tap-to-play button and the carousel's safety timer.
  const playedThisTurnRef = useRef(false);
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
    if (!v || !url || holdingRef.current) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('x5-playsinline', '');
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err: unknown) => {
        // AbortError = interrupted by our own pause() (hold or slide change), not an autoplay block.
        if (err instanceof DOMException && err.name === 'AbortError') return;
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
    }, holding ? HOLD_TIMEOUT_MS : STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [buffering, shouldPlay, holding]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url) return;
    if (!shouldPlay) {
      if (!v.paused) selfPauseRef.current = true;
      v.pause();
      return;
    }
    holdingRef.current = false;
    resumeTriesRef.current = 0;
    playedThisTurnRef.current = false;
    attemptPlay();
    const raf = requestAnimationFrame(() => attemptPlay());
    const timer = window.setTimeout(() => {
      if (v.paused && !v.ended && !holdingRef.current) {
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
    holdingRef.current = false;
    playedThisTurnRef.current = true;
    setHolding(false);
    setPlaying(true);
    setNeedsTap(false);
    setBuffering(false);
    setStalled(false);
  }, []);

  const onWaiting = useCallback(() => {
    setBuffering(true);
    const v = videoRef.current;
    if (holdUntilPlayable && v && !v.paused && !holdingRef.current) {
      holdingRef.current = true;
      setHolding(true);
      selfPauseRef.current = true;
      v.pause();
    }
  }, [holdUntilPlayable, videoRef]);

  const onPause = useCallback(() => {
    const v = videoRef.current;
    if (selfPauseRef.current) {
      selfPauseRef.current = false;
      return;
    }
    if (!v || v.ended || holdingRef.current || !shouldPlayRef.current || !playedThisTurnRef.current) return;
    // The browser paused the showing clip by itself: resume, and if it refuses, move on rather
    // than leaving a frozen frame until the carousel's safety timer.
    if (resumeTriesRef.current < 2) {
      resumeTriesRef.current += 1;
      window.setTimeout(() => attemptPlay(), 300);
    }
    window.setTimeout(() => {
      const el = videoRef.current;
      if (el && el.paused && !el.ended && !holdingRef.current && shouldPlayRef.current) onStalledRef.current?.();
    }, 1500);
  }, [attemptPlay, videoRef]);

  const onCanPlay = useCallback(() => {
    if (holdingRef.current) return;
    setBuffering(false);
    setStalled(false);
    if (shouldPlayRef.current) attemptPlay();
  }, [attemptPlay]);

  const onCanPlayThrough = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    setBuffering(false);
    setStalled(false);
    if (shouldPlayRef.current) attemptPlay();
  }, [attemptPlay]);

  const onTapPlay = useCallback(() => {
    holdingRef.current = false;
    attemptPlay();
    setNeedsTap(false);
  }, [attemptPlay]);

  return { playing, needsTap, buffering, stalled, attemptPlay, onPlaying, onWaiting, onPause, onCanPlay, onCanPlayThrough, onTapPlay };
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
  holdUntilPlayable?: boolean;
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
  holdUntilPlayable = false,
}: HeroAutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldPlay = playingProp !== false;
  useEffect(() => {
    const v = videoRef.current;
    if (v && restartToken != null && v.currentTime > 0) v.currentTime = 0;
  }, [restartToken]);
  const { playing, needsTap, buffering, stalled, attemptPlay, onPlaying, onWaiting, onPause, onCanPlay, onCanPlayThrough, onTapPlay } =
    useMutedAutoplay(videoRef, url, shouldPlay, onStalled, holdUntilPlayable);
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
        onCanPlayThrough={onCanPlayThrough}
        onPlaying={onPlaying}
        onWaiting={onWaiting}
        onPause={onPause}
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
  holdUntilPlayable,
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
        holdUntilPlayable={holdUntilPlayable}
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
