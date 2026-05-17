'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Dev-only: when ?debugOverflow=1, outlines elements that overflow the viewport.
 * Also logs offending elements to console (selector path + width).
 * Never enable in production.
 */
export function OverflowDebug() {
  const searchParams = useSearchParams();
  const debugParam = searchParams?.get('debugOverflow') === '1';
  const enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && debugParam;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const check = () => {
      const vw = document.documentElement.clientWidth;
      const all = document.body.querySelectorAll('*');
      const offenders: { el: Element; scrollWidth: number; path: string }[] = [];

      all.forEach((el) => {
        if (el instanceof HTMLElement) {
          const { scrollWidth, clientWidth } = el;
          if (scrollWidth > clientWidth && clientWidth > 0 && scrollWidth > vw) {
            const path = getSelectorPath(el);
            offenders.push({ el, scrollWidth, path });
          }
        }
      });

      // Remove previous outlines
      document.body.querySelectorAll('[data-overflow-debug]').forEach((n) => {
        (n as HTMLElement).style.outline = '';
        (n as HTMLElement).removeAttribute('data-overflow-debug');
      });

      if (offenders.length > 0) {
        offenders.forEach(({ el, scrollWidth, path }) => {
          (el as HTMLElement).style.outline = '2px solid red';
          (el as HTMLElement).setAttribute('data-overflow-debug', '1');
          console.warn('[OverflowDebug]', path, 'scrollWidth:', scrollWidth, 'viewport:', vw);
        });
      }
    };

    function getSelectorPath(el: Element): string {
      const parts: string[] = [];
      let current: Element | null = el;
      while (current && current !== document.body) {
        let sel = current.tagName.toLowerCase();
        if (current.id) sel += `#${current.id}`;
        else if (current.className && typeof current.className === 'string')
          sel += '.' + (current.className as string).trim().split(/\s+/)[0] || '';
        parts.unshift(sel);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    check();
    const t = setTimeout(check, 1000);
    window.addEventListener('resize', check);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', check);
      document.body.querySelectorAll('[data-overflow-debug]').forEach((n) => {
        (n as HTMLElement).style.outline = '';
        (n as HTMLElement).removeAttribute('data-overflow-debug');
      });
    };
  }, [enabled]);

  return null;
}
