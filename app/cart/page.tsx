'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/shop/CartContext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';

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
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/60 mb-6">Your cart is empty.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold hover:opacity-90 transition-opacity"
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
                    className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                          —
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.productSlug}`}
                        className="text-white font-medium hover:text-[var(--accent)] transition-colors"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-white/60 text-sm">{item.variantName}</p>
                      )}
                      <p className="text-[var(--accent)] font-medium mt-1">
                        ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-white w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-white/50 hover:text-red-400 text-sm ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div className="text-xl">
                  <span className="text-white/60">Total </span>
                  <span className="text-white font-semibold">${(totalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/shop"
                    className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors font-medium"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isCheckingOut ? 'Processing…' : 'Checkout'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
