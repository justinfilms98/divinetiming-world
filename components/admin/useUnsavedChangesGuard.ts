'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminDialog } from '@/components/admin/AdminDialog';

/**
 * While `active`, warns before the page is closed or reloaded (browser prompt) and before an in-app
 * link is followed (admin dialog). `message` explains what would be lost.
 */
export function useUnsavedChangesGuard(active: boolean, message: string) {
  const router = useRouter();
  const dialog = useAdminDialog();
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      void dialog
        .confirm({
          title: 'Leave without saving?',
          message: messageRef.current,
          confirmLabel: 'Leave without saving',
          cancelLabel: 'Stay on this page',
          tone: 'danger',
        })
        .then((leave) => {
          if (leave) router.push(`${url.pathname}${url.search}${url.hash}`);
        });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [active, dialog, router]);
}
