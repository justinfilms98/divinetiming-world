'use client';

import { useState } from 'react';
import { useCart } from './CartContext';

interface ProductVariant {
  id: string;
  name: string;
  price_cents: number | null;
  inventory_count: number;
  stripe_price_id: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  stripe_product_id: string | null;
  product_variants: ProductVariant[];
  product_images?: { image_url: string }[];
}

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.product_variants?.length ? product.product_variants[0].id : null
  );
  const hasVariants = product.product_variants && product.product_variants.length > 0;
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const selectedVariantData = product.product_variants?.find((v) => v.id === selectedVariant);
  const priceCents = selectedVariantData?.price_cents ?? product.price_cents;
  const stripePriceId = selectedVariantData?.stripe_price_id;
  const imageUrl = product.product_images?.[0]?.image_url ?? null;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: hasVariants ? selectedVariant : null,
      variantName: selectedVariantData?.name ?? null,
      priceCents: (priceCents ?? product.price_cents) as number,
      imageUrl,
      quantity,
    });
  };

  const handleCheckout = async () => {
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
        alert(data?.error || 'Checkout is temporarily unavailable. Please try again later or contact us.');
      }
    } catch {
      alert('Checkout is temporarily unavailable. Please try again later or contact us.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Variant Selection */}
      {product.product_variants && product.product_variants.length > 0 && (
        <div className="mb-6">
          <label className="block text-[var(--text)] font-semibold mb-2 type-label">Select Option</label>
          <select
            value={selectedVariant || ''}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2 bg-[var(--bg)] border border-[var(--accent)]/20 rounded-[var(--radius-button)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {product.product_variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
                {variant.price_cents && variant.price_cents !== product.price_cents
                  ? ` (+$${((variant.price_cents - product.price_cents) / 100).toFixed(2)})`
                  : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity */}
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
            onClick={() => setQuantity(quantity + 1)}
            className="min-h-[48px] px-4 py-2 rounded-[var(--radius-button)] bg-[var(--bg)] border border-[var(--accent)]/20 text-[var(--text)] hover:border-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart & Buy Now: brand-consistent CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={(hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity) || (!hasVariants && false)}
          className="flex-1 min-h-[48px] px-6 py-3 rounded-[var(--radius-button)] type-button border border-[var(--accent)]/20 text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-[color,border-color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity
            ? 'Out of Stock'
            : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading || (hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity)}
          className="flex-1 min-h-[48px] px-6 py-3 rounded-[var(--radius-button)] type-button bg-[var(--accent)] text-[var(--text)] hover:bg-[var(--accent-hover)] transition-[color,background-color,transform] duration-200 shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
