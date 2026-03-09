'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';

interface ProductImage {
  image_url: string;
  display_order?: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const main = sorted[selectedIndex];

  if (!sorted.length) {
    return (
      <div className="aspect-square w-full rounded-xl border border-[var(--accent)]/10 bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] type-body">
        No image
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
        <Image
          src={main.image_url}
          alt={productName}
          fill
          priority
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Product images">
          {sorted.map((img, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
                i === selectedIndex ? 'border-[var(--accent)]' : 'border-transparent hover:border-[var(--accent)]/30'
              }`}
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 25vw, 12vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
