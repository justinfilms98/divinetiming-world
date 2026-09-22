'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Success / cancel banners after Stripe Checkout redirect.
 * Safe to render when Stripe is not configured — query params simply never appear.
 */
export function ShopCheckoutBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<{ kind: 'success' | 'cancel'; text: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled') ?? searchParams.get('cancelled');
    if (success === 'true') {
      setMessage({
        kind: 'success',
        text: 'Payment received. Thank you — a confirmation will arrive by email when checkout is fully live.',
      });
    } else if (canceled === 'true') {
      setMessage({
        kind: 'cancel',
        text: 'Checkout was cancelled. Your cart items are still available if you want to try again.',
      });
    } else {
      setMessage(null);
      return;
    }

    // Clear the query so a refresh does not keep flashing the banner.
    router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  if (!message) return null;

  const styles =
    message.kind === 'success'
      ? 'border-[var(--accent)]/35 bg-[var(--accent)]/10 text-[var(--text)]'
      : 'border-[var(--text)]/20 bg-[var(--bg-secondary)] text-[var(--text-muted)]';

  return (
    <div role="status" className={`mb-10 rounded-[var(--radius-card)] border px-5 py-4 text-center type-body ${styles}`}>
      {message.text}
    </div>
  );
}
