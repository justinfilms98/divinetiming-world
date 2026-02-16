'use client';

import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { cn } from '@/lib/ui/cn';

interface MediaTileProps {
  type: 'image' | 'video';
  src: string;
  thumbnailUrl?: string | null;
  alt?: string;
  caption?: string | null;
  onClick?: () => void;
  className?: string;
}

export function MediaTile({
  type,
  src,
  thumbnailUrl,
  alt = '',
  caption,
  onClick,
  className,
}: MediaTileProps) {
  const imgUrl = thumbnailUrl || (type === 'image' ? src : null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative aspect-square w-full rounded-xl overflow-hidden border border-white/10',
        'bg-white/5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'transition-transform duration-300 hover:border-white/20',
        className
      )}
    >
      {type === 'image' && imgUrl ? (
        <Image
          src={imgUrl}
          alt={alt || caption || 'Image'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
      ) : type === 'video' ? (
        <>
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={alt || caption || 'Video'}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          ) : (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <span className="absolute inset-0 flex items-center justify-center text-white text-4xl drop-shadow-lg pointer-events-none">
            ▶
          </span>
        </>
      ) : null}
    </button>
  );
}
