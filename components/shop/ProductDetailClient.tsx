'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import {
  availableQuantity,
  canFulfillQuantity,
  getProductCommerceState,
  variantLabel,
} from '@/lib/shop/commerce';
import type { Product, ProductVariant } from '@/lib/types/content';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.product_variants?.length ? product.product_variants[0].id : null
  );
  const hasVariants = Boolean(product.product_variants && product.product_variants.length > 0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const selectedVariantData = product.product_variants?.find((v) => v.id === selectedVariant);
  const priceCents = selectedVariantData?.price_cents ?? product.price_cents;
  const stripePriceId = selectedVariantData?.stripe_price_id || product.stripe_price_id;
  const imageUrl = product.product_images?.[0]?.image_url ?? null;
  const commerce = getProductCommerceState(product);
  const variantAvail = selectedVariantData
    ? availableQuantity(selectedVariantData)
    : availableQuantity(hasVariants ? null : product);
  const canBuy = canFulfillQuantity(product, selectedVariant, quantity) && !commerce.soldOut;
  const variantOut =
    selectedVariantData?.track_inventory === true && (availableQuantity(selectedVariantData) ?? 0) <= 0;

  const handleAddToCart = () => {
    if (!canBuy) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: hasVariants ? selectedVariant : null,
      variantName: selectedVariantData ? variantLabel(selectedVariantData) : null,
      priceCents: (priceCents ?? product.price_cents) as number,
      imageUrl,
      quantity,
    });
  };

  const handleCheckout = async () => {
    if (!canBuy) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant,
          quantity,
          stripePriceId: stripePriceId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert(data?.error || 'Checkout is not enabled yet. You can still add this item to your cart.');
      }
    } catch {
      alert('Checkout is not enabled yet. You can still add this item to your cart.');
    } finally {
      setIsLoading(false);
    }
  };

  const maxQty = variantAvail ?? undefined;

  return (
    <div>
      {product.product_variants && product.product_variants.length > 0 && (
        <div className="mb-6">
          <label className="block text-[var(--text)] font-semibold mb-2 type-label">Select Option</label>
          <select
            value={selectedVariant || ''}
            onChange={(e) => {
              setSelectedVariant(e.target.value);
              setQuantity(1);
            }}
            className="w-full min-h-[48px] px-4 py-2 bg-[var(--bg)] border border-[var(--accent)]/20 rounded-[var(--radius-button)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {product.product_variants.map((variant: ProductVariant) => {
              const out = variant.track_inventory === true && (availableQuantity(variant) ?? 0) <= 0;
              return (
                <option key={variant.id} value={variant.id}>
                  {variantLabel(variant)}
                  {variant.price_cents && variant.price_cents !== product.price_cents
                    ? ` (+$${((variant.price_cents - product.price_cents) / 100).toFixed(2)})`
                    : ''}
                  {out ? ' — Sold out' : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-[var(--text)] font-semibold mb-2 type-label">Quantity</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="min-h-[48px] px-4 py-2 rounded-[var(--radius-button)] bg-[var(--bg)] border border-[var(--accent)]/20 text-[var(--text)] hover:border-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            −
          </button>
          <span className="text-[var(--text)] font-semibold w-12 text-center type-body">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(maxQty != null ? Math.min(maxQty, quantity + 1) : quantity + 1)}
            disabled={maxQty != null && quantity >= maxQty}
            className="min-h-[48px] px-4 py-2 rounded-[var(--radius-button)] bg-[var(--bg)] border border-[var(--accent)]/20 text-[var(--text)] hover:border-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canBuy || variantOut}
          className="flex-1 min-h-[52px] px-6 py-3 rounded-[var(--radius-button)] type-button font-semibold bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] transition-[color,background-color,transform] duration-[var(--motion-standard)] ease-[var(--ease-standard)] shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
        >
          {commerce.soldOut || variantOut
            ? 'Out of Stock'
            : commerce.isPreorder
              ? 'Preorder'
              : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading || !canBuy || variantOut}
          className="flex-1 min-h-[52px] px-6 py-3 rounded-[var(--radius-button)] type-button border border-[var(--accent)]/30 text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors duration-[var(--motion-standard)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
        >
          {isLoading ? 'Processing...' : commerce.isPreorder ? 'Preorder now' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
