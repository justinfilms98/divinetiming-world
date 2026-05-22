'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCart } from './CartContext';
import { useReducedMotion } from '@/lib/ui/reducedMotion';

export function CartSlideOut() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalCents, clearCart } = useCart();
  const reduce = useReducedMotion();
  const slideTransition = reduce ? { duration: 0.01 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok && data.data?.url) {
        clearCart();
        closeCart();
        window.location.href = data.data.url;
      } else {
        alert(data?.error || 'Checkout is temporarily unavailable. Please try again later or contact us.');
      }
    } catch {
      alert('Checkout is temporarily unavailable. Please try again later or contact us.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={slideTransition}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg)] border-l border-[var(--text)]/10 z-50 flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="p-6 border-b border-[var(--text)]/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--text)] tracking-tight">Cart</h2>
              <button
                onClick={closeCart}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 p-2 rounded-lg hover:bg-[var(--bg-secondary)]/80"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <p className="text-[var(--text-muted)] text-center py-12">Your cart is empty</p>
              ) : (
                <>
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="text-sm font-medium text-[var(--accent)] hover:underline mb-4 block"
                  >
                    View full cart →
                  </Link>
                  <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-4 pb-6 border-b border-[var(--text)]/10 last:border-0"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text)] font-semibold truncate">{item.productName}</p>
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
                            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] text-[var(--text)] text-sm font-medium hover:bg-[var(--accent)]/15 border border-[var(--text)]/10"
                          >
                            −
                          </button>
                          <span className="text-[var(--text)] w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.variantId, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] text-[var(--text)] text-sm font-medium hover:bg-[var(--accent)]/15 border border-[var(--text)]/10"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-[var(--text-muted)] hover:text-red-600 text-sm ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[var(--text)]/10 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-[var(--text-muted)] font-medium">Total</span>
                  <span className="text-[var(--text)] font-bold">
                    ${(totalCents / 100).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-[var(--accent)] text-[var(--text)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-bold"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
