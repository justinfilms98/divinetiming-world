'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { isOptimizableImageUrl } from '@/lib/media/imageHosts';

export interface LightboxItem {
  url: string;
  mediaType: 'image' | 'video';
  caption?: string | null;
  alt?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

const CONTROL =
  'flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white/85 ring-1 ring-white/15 backdrop-blur-md hover:bg-black/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

/** Fullscreen viewer: whole photo always visible (contain), keyboard arrows, swipe, tap backdrop to close. */
export function Lightbox({ items, startIndex, open, onClose }: LightboxProps) {
  if (!open || items.length === 0) return null;
  // Remount per opening so the viewer always starts on the tapped photo.
  return <LightboxDialog key={startIndex} items={items} startIndex={startIndex} onClose={onClose} />;
}

function LightboxDialog({ items, startIndex, onClose }: Omit<LightboxProps, 'open'>) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose, next, prev]);

  const item = items[index];
  if (!item) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartX.current = null;
    if (startX == null || endX == null) return;
    const dx = endX - startX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  const multiple = items.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#060607]/[0.97]"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-between px-3 sm:px-5"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <span className="text-white/60 text-xs tracking-[0.2em] tabular-nums" aria-live="polite">
          {multiple ? `${index + 1} / ${items.length}` : ''}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className={CONTROL} aria-label="Close viewer">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tapping the empty area around the photo closes the viewer. */}
      <div className="relative flex-1 min-h-0 mx-2 sm:mx-16 my-2" onClick={onClose}>
        {item.mediaType === 'video' ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : isOptimizableImageUrl(item.url) ? (
          <Image
            key={item.url}
            src={item.url}
            alt={item.alt || item.caption || ''}
            fill
            priority
            quality={88}
            sizes="100vw"
            className="object-contain select-none"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- host not allowed by the image optimiser
          <img
            key={item.url}
            src={item.url}
            alt={item.alt || item.caption || ''}
            className="absolute inset-0 m-auto max-w-full max-h-full object-contain select-none"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {multiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className={`${CONTROL} absolute left-1 sm:-left-14 top-1/2 -translate-y-1/2`}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className={`${CONTROL} absolute right-1 sm:-right-14 top-1/2 -translate-y-1/2`}
              aria-label="Next photo"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}
      </div>

      <div
        className="min-h-[2.5rem] px-5 text-center"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {item.caption && <p className="mx-auto max-w-[60ch] text-white/75 text-sm leading-relaxed">{item.caption}</p>}
      </div>
    </div>
  );
}
