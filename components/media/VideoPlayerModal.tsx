'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useScrollLock } from '@/lib/ui/useScrollLock';

/** Safe embed URL: 11-char ID only. No autoplay with sound (autoplay=0, user taps to play). */
function embedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?modestbranding=1&rel=0&autoplay=0`;
}

interface VideoPlayerModalProps {
  youtubeId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ youtubeId, title, open, onClose }: VideoPlayerModalProps) {
  const containerRef = useFocusTrap(open, handleClose);
  useScrollLock(open);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  function handleClose() {
    onClose();
    const prev = previousActiveElement.current;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
  }

  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const el = overlayRef.current;
    if (!el) return;
    const focusable = el.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Video player"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-black shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl(youtubeId)}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          {title && (
            <p className="p-3 text-white/90 text-sm truncate" style={{ fontFamily: 'var(--font-ui)' }}>
              {title}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
