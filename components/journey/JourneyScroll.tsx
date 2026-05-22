'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';

export interface JourneyBlock {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  resolved_image_url?: string | null;
  align: 'left' | 'right' | 'center';
  display_order: number;
}

interface JourneyScrollProps {
  blocks: JourneyBlock[];
}

export function JourneyScroll({ blocks }: JourneyScrollProps) {
  if (blocks.length === 0) {
    return (
      <div className="py-24 md:py-32 text-center">
        <p className="text-[var(--text-muted)] type-body leading-relaxed max-w-[40ch] mx-auto">
          Story coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
      <div className="flex flex-col gap-24 md:gap-32">
        {blocks.map((block, i) => (
          <JourneyBlockRow key={block.id} block={block} index={i} />
        ))}
      </div>
    </div>
  );
}

function JourneyBlockRow({ block, index }: { block: JourneyBlock; index: number }) {
  const imageUrl = block.resolved_image_url ?? block.image_url ?? null;
  // 'center' = no image alignment, just a centered text block
  // 'left' = image left, text right
  // 'right' = image right, text left
  const isCentered = block.align === 'center' || !imageUrl;
  const imageOnLeft = block.align === 'left';

  if (isCentered) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-[60ch] mx-auto text-center"
      >
        {imageUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl mb-8 bg-[var(--bg-secondary)]">
            <Image
              src={imageUrl}
              alt={block.title ?? ''}
              fill
              loading={index === 0 ? 'eager' : 'lazy'}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              sizes="(max-width: 768px) 100vw, 60ch"
              className="object-cover"
            />
          </div>
        )}
        {block.title && (
          <h2
            className="type-h2 text-[var(--text)] mb-5 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {block.title}
          </h2>
        )}
        {block.body && (
          <div className="text-[var(--text-muted)] type-body space-y-4 leading-relaxed">
            {block.body.split(/\n\n+/).map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        )}
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center ${imageOnLeft ? '' : 'md:[&>div:first-child]:order-2'}`}
    >
      <div className="relative aspect-[4/5] md:aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[var(--bg-secondary)]">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={block.title ?? ''}
            fill
            loading={index === 0 ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        {block.title && (
          <h2
            className="type-h2 text-[var(--text)] mb-5 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {block.title}
          </h2>
        )}
        {block.body && (
          <div className="text-[var(--text-muted)] type-body space-y-4 leading-relaxed max-w-[55ch]">
            {block.body.split(/\n\n+/).map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
