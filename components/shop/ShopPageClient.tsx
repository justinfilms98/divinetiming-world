'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import Link from 'next/link';
import { useCart } from './CartContext';
import { track } from '@/lib/analytics/track';
import { Grid } from '@/components/ui/Grid';
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
      <div className="w-full">
          <p className="text-center text-[var(--text-muted)] type-body mb-12 md:mb-14 max-w-[45ch] mx-auto leading-relaxed">
            Official merchandise and music.
          </p>
          {products.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
              hidden: {},
            }}
          >
            <Grid cols={3} className="gap-8 md:gap-10 justify-items-center">
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
            </Grid>
          </motion.div>
        ) : (
          <div className="py-24 md:py-32 text-center">
            <p className="text-[var(--text-muted)] type-body leading-relaxed max-w-[40ch] mx-auto">No products yet. Check back soon.</p>
          </div>
        )}
      </div>
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
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex flex-col items-center text-center rounded-2xl border border-[var(--accent)]/15 bg-[var(--bg-secondary)] p-6 md:p-8 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-[var(--motion-standard)] ease-[var(--ease-standard)] hover:border-[var(--accent)]/35 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 card-atmosphere"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] rounded-xl"
        onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
      >
        <div className="relative aspect-square w-full max-w-sm mx-auto mb-6 rounded-xl overflow-hidden bg-[var(--bg)]/80 border border-[var(--accent)]/5">
          {showImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover transition-[transform,filter] duration-300 ease-out group-hover:scale-[1.02] group-hover:brightness-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/50">
              <span className="text-[var(--text-muted)]/50 text-2xl font-light tracking-widest" style={{ fontFamily: 'var(--font-display)' }} aria-hidden>—</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {product.is_featured && (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">Featured</span>
        )}
        {product.badge && (
          <span className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--accent)]/30 text-[var(--accent)]">{product.badge}</span>
        )}
        {(() => {
          const variants = product.product_variants ?? [];
          const soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0);
          return soldOut ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--text-muted)]/15 text-[var(--text-muted)]">Sold out</span>
          ) : null;
        })()}
      </div>
      <h3 className="type-h3 font-medium text-[var(--text)] tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>{product.name}</h3>
      {product.subtitle && <p className="type-small text-[var(--text-muted)] mb-2.5">{product.subtitle}</p>}
      <p className="text-[var(--accent)] font-semibold type-body mb-6">{formatPrice(product.price_cents)}</p>
      {(() => {
        const variants = product.product_variants ?? [];
        const soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0);
        if (soldOut) {
          return (
            <span className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] type-button text-[var(--text-muted)] border border-[var(--accent)]/10 cursor-not-allowed">
              Sold out
            </span>
          );
        }
        if (!variants.length) {
          return (
            <button
              type="button"
              onClick={() => {
                track({ event_name: 'add_to_cart', entity_type: 'product', entity_id: product.id });
                onAddToCart({ productId: product.id, productName: product.name, productSlug: product.slug, variantId: null, variantName: null, priceCents: product.price_cents, imageUrl: mainImage ?? null });
              }}
              className="min-h-[48px] px-6 py-3 rounded-[var(--radius-button)] type-button text-[var(--text)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors duration-[var(--motion-standard)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] active:scale-[0.98] btn-lift"
            >
              Add to Cart
            </button>
          );
        }
        return (
          <Link
            href={`/shop/${product.slug}`}
            onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] type-button text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 transition-colors duration-[var(--motion-standard)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] active:scale-[0.98] btn-lift"
          >
            View Options
          </Link>
        );
      })()}
    </motion.article>
  );
}
