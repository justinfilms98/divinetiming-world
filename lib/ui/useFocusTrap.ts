'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

/**
 * Traps focus inside container. Handles Tab / Shift+Tab and Escape.
 * On Escape, calls onEscape and does not prevent default (caller closes and moves focus).
 */
export function useFocusTrap(active: boolean, onEscape: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const el = containerRef.current;
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => {
      if (n.hasAttribute('disabled')) return false;
      if (n.getAttribute('aria-hidden') === 'true') return false;
      const tag = n.tagName.toLowerCase();
      if (tag === 'a') return !!(n as HTMLAnchorElement).href;
      return true;
    });

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first) first.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const current = document.activeElement as HTMLElement | null;
      if (!current || !el.contains(current)) return;
      const idx = focusable.indexOf(current);
      if (idx === -1) return;
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, onEscape]);

  return containerRef;
}
