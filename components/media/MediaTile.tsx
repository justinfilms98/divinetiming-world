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
        'relative aspect-video w-full rounded-xl overflow-hidden border border-[var(--accent)]/20 shadow-[var(--shadow-card)]',
        'bg-[var(--bg-secondary)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] card-atmosphere',
        'transition-[border-color,box-shadow,filter,transform] duration-[200ms] ease-out hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-card-hover)] hover:brightness-[1.03] hover:-translate-y-0.5',
        className
      )}
    >
      {type === 'image' && imgUrl ? (
        <>
          <Image
            src={imgUrl}
            alt={alt || caption || 'Image'}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-[filter] duration-[200ms] ease-out group-hover:brightness-[1.05]"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-[200ms]" />
        </>
      ) : type === 'video' ? (
        <>
          {imgUrl ? (
            <>
              <Image
                src={imgUrl}
                alt={alt || caption || 'Video'}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-[filter] duration-[200ms] ease-out group-hover:brightness-[1.05]"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-[200ms]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-black/40" />
          )}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] bg-black/20">
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </span>
          </span>
        </>
      ) : null}
    </button>
  );
}
