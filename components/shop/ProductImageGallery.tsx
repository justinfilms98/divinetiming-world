'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { motion } from 'framer-motion';
import { Lightbox, type LightboxItem } from '@/components/media/Lightbox';

interface ProductImage {
  image_url: string;
  display_order?: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Dior-style editorial product gallery: vertical stack of all product images,
 * each revealing on scroll. Click any image to open a fullscreen lightbox.
 * Falls back to a single placeholder when no images are present.
 */
export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!sorted.length) {
    return (
      <div className="aspect-[4/5] w-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] type-body border border-[var(--accent)]/10">
        No image
      </div>
    );
  }

  const lightboxItems: LightboxItem[] = sorted.map((img) => ({
    url: img.image_url,
    mediaType: 'image',
    alt: productName,
  }));

  return (
    <div className="w-full space-y-3 md:space-y-4">
      {sorted.map((img, i) => (
        <motion.button
          key={`${img.image_url}-${i}`}
          type="button"
          onClick={() => setOpenIndex(i)}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative block w-full aspect-[4/5] overflow-hidden bg-[var(--bg-secondary)] group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          aria-label={`${productName} — image ${i + 1} of ${sorted.length}`}
        >
          <Image
            src={img.image_url}
            alt={i === 0 ? productName : ''}
            fill
            priority={i === 0}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </motion.button>
      ))}

      <Lightbox
        items={lightboxItems}
        startIndex={openIndex ?? 0}
        open={openIndex != null}
        onClose={() => setOpenIndex(null)}
      />
    </div>
  );
}
