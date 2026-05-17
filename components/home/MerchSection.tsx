'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface ProductImage {
  image_url: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  product_images: ProductImage[];
}

interface MerchSectionProps {
  products: Product[];
}

export function MerchSection({ products }: MerchSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <section className="py-20 px-4 bg-[var(--bg2)]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-12 text-center"
        >
          Featured Merch
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const mainImage = product.product_images?.[0]?.image_url;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/shop/${product.slug}`} className="block group">
                  <div className="relative aspect-square bg-[var(--bg)] rounded-lg overflow-hidden mb-4">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text)]/30">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-[var(--text)] font-semibold mb-1">{product.name}</div>
                  <div className="text-[var(--accent)]">{formatPrice(product.price_cents)}</div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/shop"
            className="text-[var(--accent)] hover:text-[var(--accent2)] transition-colors font-semibold"
          >
            View All Products →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
