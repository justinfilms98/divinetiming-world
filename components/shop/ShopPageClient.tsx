'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import Link from 'next/link';
import { useCart } from './CartContext';
import { track } from '@/lib/analytics/track';
import { Container } from '@/components/ui/Container';
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
    <>
      <Container>
        <p className="text-center text-[var(--text-muted)] type-body mb-10 md:mb-12 max-w-[45ch] mx-auto">
          Official merchandise and music.
        </p>
        {products.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
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
          <div className="py-20 text-center">
            <p className="text-[var(--text-muted)] text-lg tracking-wide type-body">No products yet.</p>
          </div>
        )}
      </Container>
    </>
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
      variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 8 } }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col items-center text-center rounded-[var(--radius-card)] border border-[var(--accent)]/20 bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 card-atmosphere"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] rounded-[var(--radius-card)]"
        onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
      >
        <div className="relative aspect-square w-full max-w-sm mx-auto mb-6 rounded-[var(--radius-card)] overflow-hidden">
          {showImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--bg)] flex items-center justify-center">
              <span className="text-[var(--text-muted)] text-4xl font-light" aria-hidden>—</span>
            </div>
          )}
        </div>
      </Link>
      <h3 className="type-h3 font-medium text-[var(--text)] tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>{product.name}</h3>
      <p className="text-[var(--accent)] font-light text-lg mb-4">{formatPrice(product.price_cents)}</p>
      {(!product.product_variants || product.product_variants.length === 0) ? (
        <button
          type="button"
          onClick={() => {
            track({ event_name: 'add_to_cart', entity_type: 'product', entity_id: product.id });
            onAddToCart({ productId: product.id, productName: product.name, productSlug: product.slug, variantId: null, variantName: null, priceCents: product.price_cents, imageUrl: mainImage ?? null });
          }}
          className="min-h-[48px] px-6 py-3 rounded-[var(--radius-button)] type-button text-[var(--text)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] active:scale-[0.98]"
        >
          Add to Cart
        </button>
      ) : (
        <Link
          href={`/shop/${product.slug}`}
          onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
          className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] type-button text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] active:scale-[0.98]"
        >
          View Options
        </Link>
      )}
    </motion.article>
  );
}
