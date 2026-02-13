'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import Link from 'next/link';
import { useCart } from './CartContext';
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
                <motion.article
                  key={product.id}
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 24 },
                  }}
                  className="group relative flex flex-col items-center text-center"
                >
                  {/* Floating product image - no box */}
                  <Link href={`/shop/${product.slug}`} className="block w-full">
                    <div className="relative aspect-square w-full max-w-sm mx-auto mb-6">
                      {mainImage ? (
                        <Image
                          src={mainImage}
                          alt={product.name}
                          fill
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                          <span className="text-white/20 text-4xl font-light">—</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Minimal typography */}
                  <h3 className="text-xl font-medium text-white tracking-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[var(--accent)] font-light text-lg mb-4">
                    {formatPrice(product.price_cents)}
                  </p>

                  {/* Quick add-to-cart (or link to product if variants) */}
                  {(!product.product_variants || product.product_variants.length === 0) ? (
                    <button
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          productName: product.name,
                          productSlug: product.slug,
                          variantId: null,
                          variantName: null,
                          priceCents: product.price_cents,
                          imageUrl: mainImage ?? null,
                        })
                      }
                      className="text-sm uppercase tracking-widest text-white/70 hover:text-[var(--accent)] transition-colors border-b border-transparent hover:border-[var(--accent)] pb-0.5"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <Link
                      href={`/shop/${product.slug}`}
                      className="text-sm uppercase tracking-widest text-white/70 hover:text-[var(--accent)] transition-colors border-b border-transparent hover:border-[var(--accent)] pb-0.5"
                    >
                      View Options
                    </Link>
                  )}
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <p className="text-center text-white/50 py-20">No products available. Check back soon.</p>
        )}
      </div>
    </section>
  );
}
