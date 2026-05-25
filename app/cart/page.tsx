'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/shop/CartContext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Container } from '@/components/ui/Container';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalCents, clearCart, closeCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data?.data?.url) {
        clearCart();
        closeCart();
        window.location.href = data.data.url;
      } else {
        alert(data?.error || 'Checkout is temporarily unavailable. Please try again later or contact us.');
      }
    } catch (e) {
      alert('Checkout is temporarily unavailable. Please try again later or contact us.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        headline="Cart"
        subtext={items.length > 0 ? `${items.length} item${items.length === 1 ? '' : 's'}` : undefined}
        heightPreset="standard"
      />
      <main className="flex-1 pt-8 md:pt-12 pb-16 min-w-0">
        <Container>
        <div className="max-w-2xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-muted)] mb-6">Your cart is empty.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="space-y-6">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className="flex gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--text)]/10"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-sm">
                          —
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.productSlug}`}
                        className="text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-[var(--text-muted)] text-sm">{item.variantName}</p>
                      )}
                      <p className="text-[var(--accent)] font-semibold mt-1">
                        ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-lg bg-[var(--bg)] text-[var(--text)] text-sm font-medium hover:bg-[var(--accent)]/15 border border-[var(--text)]/10 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-[var(--text)] w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-lg bg-[var(--bg)] text-[var(--text)] text-sm font-medium hover:bg-[var(--accent)]/15 border border-[var(--text)]/10 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-[var(--text-muted)] hover:text-red-600 text-sm ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-[var(--text)]/10">
                <div className="text-xl">
                  <span className="text-[var(--text-muted)]">Total </span>
                  <span className="text-[var(--text)] font-bold">${(totalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/shop"
                    className="px-6 py-3 border border-[var(--text)]/20 text-[var(--text)] rounded-lg hover:bg-[var(--bg-secondary)]/80 transition-colors font-semibold text-center"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--text)] rounded-lg font-bold hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                  >
                    {isCheckingOut ? 'Processing…' : 'Checkout'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </Container>
      </main>
    </div>
  );
}
