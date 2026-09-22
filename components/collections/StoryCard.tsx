'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { collectionStoryHref } from '@/lib/content/shared';
import { cn } from '@/lib/ui/cn';
import type { GalleryForHub } from '@/lib/content/shared';

interface StoryCardProps {
  story: GalleryForHub;
  featured?: boolean;
  imageOnRight?: boolean;
}

export function StoryCard({ story, featured = false, imageOnRight = false }: StoryCardProps) {
  const href = collectionStoryHref(story.slug);
  const cover = story.resolved_cover_url;
  const theme = story.theme?.trim() || null;
  const intro = story.description?.trim() || null;

  return (
    <Link
      href={href}
      className={cn(
        'group grid grid-cols-1 gap-6 md:gap-10 items-center focus-ring rounded-[var(--radius-card)]',
        featured ? 'md:grid-cols-1' : 'md:grid-cols-2'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--accent)]/20 bg-[var(--bg-secondary)]',
          featured ? 'aspect-[16/9]' : 'aspect-[4/3]',
          !featured && imageOnRight && 'md:order-2'
        )}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            sizes={featured ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--bg-secondary)]" aria-hidden />
        )}
      </div>

      <div className={cn(!featured && imageOnRight && 'md:order-1')}>
        {theme && <p className="section-label mb-3">{theme}</p>}
        {story.is_featured && !theme && <p className="section-label mb-3">Featured</p>}
        <h2
          className={cn(
            'text-[var(--text)] tracking-tight group-hover:text-[var(--accent)] transition-colors',
            featured ? 'type-h1' : 'type-h2'
          )}
        >
          {story.name}
        </h2>
        {intro && (
          <p
            className={cn(
              'type-body text-[var(--text-muted)] mt-4 prose-readability',
              featured ? 'max-w-[40ch]' : 'line-clamp-3 max-w-[42ch]'
            )}
          >
            {intro}
          </p>
        )}
        <p className="type-button text-[var(--accent)] mt-6">Read the story →</p>
      </div>
    </Link>
  );
}
