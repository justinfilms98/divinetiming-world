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

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Variant Selection */}
      {product.product_variants && product.product_variants.length > 0 && (
        <div className="mb-6">
          <label className="block text-[var(--text)] font-semibold mb-2">Select Option</label>
          <select
            value={selectedVariant || ''}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--bg2)] border border-[var(--accent)]/20 rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
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
        <label className="block text-[var(--text)] font-semibold mb-2">Quantity</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 bg-[var(--bg2)] border border-[var(--accent)]/20 rounded-md text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            −
          </button>
          <span className="text-[var(--text)] font-semibold w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 bg-[var(--bg2)] border border-[var(--accent)]/20 rounded-md text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart & Buy Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleAddToCart}
          disabled={(hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity) || (!hasVariants && false)}
          className="flex-1 px-6 py-4 bg-white/10 text-white border border-white/20 rounded-md hover:bg-white/20 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity
            ? 'Out of Stock'
            : 'Add to Cart'}
        </button>
        <button
          onClick={handleCheckout}
          disabled={isLoading || (hasVariants && selectedVariantData && selectedVariantData.inventory_count < quantity)}
          className="flex-1 px-6 py-4 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
