'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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

/** Fullscreen lightbox with keyboard arrows + swipe. ~minimal, no dependencies. */
export function Lightbox({ items, startIndex, open, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, next, prev]);

  if (!open || items.length === 0) return null;
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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
        {item.mediaType === 'video' ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt={item.alt || item.caption || ''}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}
      </div>

      {item.caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white/80 text-sm max-w-[80vw] truncate">
          {item.caption}
        </p>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 text-white/50 text-xs tracking-wider tabular-nums">
          {index + 1} / {items.length}
        </div>
      )}
    </div>
  );
}
