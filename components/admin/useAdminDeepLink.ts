'use client';

import { useEffect, useRef } from 'react';

/**
 * Opens an editor from a link such as `/admin/events?edit=<id>` or `/admin/events?new=1`
 * (used by the dashboard). Runs once, after the list has loaded, then removes the
 * parameter so a refresh or Back does not reopen it.
 */
export function useAdminDeepLink<T extends { id: string }>(
  items: T[],
  ready: boolean,
  handlers: { edit?: (item: T) => void; create?: () => void }
) {
  const handled = useRef(false);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (handled.current || !ready) return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const create = params.get('new') === '1';
    if (!editId && !create) {
      handled.current = true;
      return;
    }
    // Marked handled only when it actually runs: if the list updates again before the timer
    // fires, the effect re-runs with the fresh list instead of silently giving up.
    const timer = window.setTimeout(() => {
      handled.current = true;
      if (editId) {
        const item = items.find((i) => i.id === editId);
        if (item) handlersRef.current.edit?.(item);
      } else {
        handlersRef.current.create?.();
      }
      params.delete('edit');
      params.delete('new');
      const query = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [items, ready]);
}
