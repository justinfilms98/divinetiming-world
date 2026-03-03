'use client';

import { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useScrollLock } from '@/lib/ui/useScrollLock';

export interface ViewerItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string | null;
}

interface ViewerModalProps {
  items: ViewerItem[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function ViewerModal({ items, currentIndex, onClose, onIndexChange }: ViewerModalProps) {
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    const prev = previousActiveElement.current;
    if (prev && typeof prev.focus === 'function') prev.focus();
    onClose();
  }, [onClose]);

  const containerRef = useFocusTrap(!!item, handleClose);
  useScrollLock(!!item);

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange?.(currentIndex - 1);
  }, [currentIndex, hasPrev, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange?.(currentIndex + 1);
  }, [currentIndex, hasNext, onIndexChange]);

  useEffect(() => {
    if (item) previousActiveElement.current = document.activeElement as HTMLElement | null;
  }, [item]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, goPrev, goNext]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Media viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={handleClose}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {hasPrev && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-6xl max-h-[85vh] w-full mx-4 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {item.type === 'image' ? (
            <div className="relative w-full max-h-[80vh] aspect-auto">
              <Image
                src={item.url}
                alt={item.caption || 'Media'}
                width={1200}
                height={1200}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </div>
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-w-full max-h-[80vh] w-auto rounded-lg"
            />
          )}
          {item.caption && (
            <p className="mt-4 text-white/80 text-center text-sm max-w-xl">{item.caption}</p>
          )}
        </motion.div>

        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          {currentIndex + 1} / {items.length}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
