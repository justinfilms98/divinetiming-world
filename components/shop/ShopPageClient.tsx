'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import Link from 'next/link';
import { useCart } from './CartContext';
import { track } from '@/lib/analytics/track';
import type { Product } from '@/lib/types/content';

interface ShopPageClientProps {
  products: Product[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ShopPageClient({ products }: ShopPageClientProps) {
  const { addItem } = useCart();

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {products.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {},
            }}
          >
            {products.map((product) => {
              const images = product.product_images as { image_url: string; display_order: number }[] | undefined;
              const sortedImages = images?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
              const mainImage = sortedImages?.[0]?.image_url;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  mainImage={mainImage}
                  onAddToCart={addItem}
                  formatPrice={formatPrice}
                  track={track}
                />
              );
            })}
          </motion.div>
        ) : (
          <p className="text-white/50 text-center py-12">No products yet.</p>
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  mainImage,
  onAddToCart,
  formatPrice,
  track,
}: {
  product: Product;
  mainImage?: string;
  onAddToCart: (item: Parameters<ReturnType<typeof useCart>['addItem']>[0]) => void;
  formatPrice: (cents: number) => string;
  track: (p: { event_name: string; entity_type: string; entity_id: string }) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = mainImage && !imageError;
  return (
    <motion.article
      variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 24 } }}
      className="group relative flex flex-col items-center text-center rounded-[12px] border border-[var(--accent)]/20 bg-[var(--bg-secondary)] p-6 shadow-md transition-all duration-300 hover:border-[var(--accent)]/60 hover:shadow-lg"
    >
      <Link href={`/shop/${product.slug}`} className="block w-full" onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}>
        <div className="relative aspect-square w-full max-w-sm mx-auto mb-6 rounded-[12px] overflow-hidden">
          {showImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--bg)] flex items-center justify-center">
              <span className="text-[var(--text-muted)] text-4xl font-light">—</span>
            </div>
          )}
        </div>
      </Link>
      <h3 className="text-xl font-medium text-[var(--text)] tracking-tight mb-1" style={{ fontFamily: 'var(--font-headline)' }}>{product.name}</h3>
      <p className="text-[var(--accent)] font-light text-lg mb-4">{formatPrice(product.price_cents)}</p>
      {(!product.product_variants || product.product_variants.length === 0) ? (
        <button
          onClick={() => {
            track({ event_name: 'add_to_cart', entity_type: 'product', entity_id: product.id });
            onAddToCart({ productId: product.id, productName: product.name, productSlug: product.slug, variantId: null, variantName: null, priceCents: product.price_cents, imageUrl: mainImage ?? null });
          }}
          className="min-h-[48px] px-6 py-3 text-sm uppercase tracking-widest text-[var(--text)] hover:text-[var(--accent)] transition-all duration-200 border-b border-transparent hover:border-[var(--accent)] pb-0.5 -translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
        >
          Add to Cart
        </button>
      ) : (
        <Link href={`/shop/${product.slug}`} onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })} className="min-h-[48px] inline-flex items-center text-sm uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-all duration-200 border-b border-transparent hover:border-[var(--accent)] pb-0.5 -translate-y-0 hover:-translate-y-0.5 active:translate-y-0">
          View Options
        </Link>
      )}
    </motion.article>
  );
}
