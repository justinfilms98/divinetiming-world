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
    <div className="w-full max-w-full">
      <p className="text-center text-[var(--text-muted)] type-body mb-14 md:mb-16 max-w-[45ch] mx-auto leading-relaxed">
        Official merchandise and music.
      </p>

      {products.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16 w-full max-w-7xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0 } },
            hidden: {},
          }}
        >
          {products.map((product) => {
            const images = product.product_images as { image_url: string; display_order: number }[] | undefined;
            const sortedImages = images?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
            const primary = sortedImages?.[0]?.image_url;
            const secondary = sortedImages?.[1]?.image_url;
            return (
              <EditorialProductCard
                key={product.id}
                product={product}
                primaryImage={primary}
                secondaryImage={secondary}
                onAddToCart={addItem}
              />
            );
          })}
        </motion.div>
      ) : (
        <div className="py-24 md:py-32 text-center">
          <p className="text-[var(--text-muted)] type-body leading-relaxed max-w-[40ch] mx-auto">
            No products yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

interface EditorialProductCardProps {
  product: Product;
  primaryImage?: string;
  secondaryImage?: string;
  onAddToCart: (item: Parameters<ReturnType<typeof useCart>['addItem']>[0]) => void;
}

function EditorialProductCard({ product, primaryImage, secondaryImage, onAddToCart }: EditorialProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = primaryImage && !imageError;
  const variants = product.product_variants ?? [];
  const soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0);
  const hasVariants = variants.length > 0;

  return (
    <motion.article
      variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 12 } }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="group flex flex-col"
    >
      <Link
        href={`/shop/${product.slug}`}
        onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
        className="block relative aspect-[3/4] w-full overflow-hidden bg-[var(--bg-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {showImage ? (
          <>
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className={`object-cover transition-all duration-700 ease-out ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage}
                alt=""
                fill
                loading="lazy"
                className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                aria-hidden
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]">
            <span
              className="text-[var(--text-muted)]/40 text-4xl font-light tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
              aria-hidden
            >
              —
            </span>
          </div>
        )}

        {/* Badge row */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.15em] font-medium bg-black/70 text-[var(--accent)] backdrop-blur-sm">
              Featured
            </span>
          )}
          {product.badge && (
            <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.15em] font-medium bg-black/70 text-white backdrop-blur-sm">
              {product.badge}
            </span>
          )}
          {soldOut && (
            <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.15em] font-medium bg-black/70 text-[var(--text-muted)] backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Editorial hover label */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
          <span className="text-white text-xs uppercase tracking-[0.25em]">Discover</span>
        </div>
      </Link>

      <div className="mt-4 px-1 flex flex-col gap-1.5">
        <Link
          href={`/shop/${product.slug}`}
          onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
          className="focus:outline-none focus-visible:underline"
        >
          <h3
            className="text-[var(--text)] font-medium tracking-tight transition-colors duration-200 group-hover:text-[var(--accent)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.name}
          </h3>
        </Link>
        {product.subtitle && (
          <p className="type-small text-[var(--text-muted)] line-clamp-1">{product.subtitle}</p>
        )}
        <p className="text-[var(--text)] font-medium tabular-nums mt-1">{formatPrice(product.price_cents)}</p>

        <div className="mt-3">
          {soldOut ? (
            <span className="inline-flex h-10 items-center px-4 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--text-muted)]/30">
              Sold Out
            </span>
          ) : hasVariants ? (
            <Link
              href={`/shop/${product.slug}`}
              onClick={() => track({ event_name: 'product_click', entity_type: 'product', entity_id: product.id })}
              className="inline-flex h-10 items-center px-4 text-xs uppercase tracking-[0.2em] text-[var(--text)] border-b border-[var(--text)]/40 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Select Options
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                track({ event_name: 'add_to_cart', entity_type: 'product', entity_id: product.id });
                onAddToCart({
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  variantId: null,
                  variantName: null,
                  priceCents: product.price_cents,
                  imageUrl: primaryImage ?? null,
                });
              }}
              className="inline-flex h-10 items-center px-4 text-xs uppercase tracking-[0.2em] text-[var(--text)] border-b border-[var(--text)]/40 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
