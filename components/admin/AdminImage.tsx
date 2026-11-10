'use client';

import Image from 'next/image';
import { cn } from '@/lib/ui/cn';
import { canOptimizeImage } from '@/lib/media/mediaUrls';
import { displayImageUrl } from '@/lib/media/webCopies';

interface AdminImageProps {
  src: string;
  alt?: string;
  /** Rendered width hint for the optimizer, e.g. "160px" or "(max-width: 640px) 50vw, 240px". */
  sizes: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * Admin preview image that fills its (relatively positioned) parent. Loads a resized copy from the
 * image optimizer instead of the full-resolution original; local previews (data:/blob:) and
 * unknown hosts fall back to a plain <img>.
 */
export function AdminImage({ src, alt = '', sizes, className, onError }: AdminImageProps) {
  const url = displayImageUrl(src);
  if (!canOptimizeImage(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local previews and unknown hosts can't be optimized
      <img src={url} alt={alt} className={cn('absolute inset-0 w-full h-full object-cover', className)} onError={onError} />
    );
  }
  return <Image src={url} alt={alt} fill sizes={sizes} quality={70} className={cn('object-cover', className)} onError={onError} />;
}
