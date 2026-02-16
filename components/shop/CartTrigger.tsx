'use client';

import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';

export function CartTrigger() {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();

  const isShopPage = pathname?.startsWith('/shop');
  const isCartPage = pathname === '/cart';
  if (!isShopPage && !isCartPage && itemCount === 0) return null;

  return (
    <button
      onClick={openCart}
      className="fixed bottom-20 left-6 z-50 w-12 h-12 rounded-full bg-[var(--bg)]/95 backdrop-blur-md border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex items-center justify-center text-white hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-all duration-250 ease-out md:bottom-6 md:left-6"
      aria-label={`Open cart (${itemCount} items)`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
