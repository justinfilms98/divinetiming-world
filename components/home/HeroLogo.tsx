'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroLogoProps {
  /** Logo image URL (Supabase Storage or legacy CDN e.g. Uploadcare) */
  url: string;
  alt?: string;
  /** Rendered when image fails to load so we don't show a broken image */
  fallback?: React.ReactNode;
}

/**
 * Renders the hero logo image in place of the text title.
 * Mobile: max-height 56px; Desktop: max-height 88px. Aspect ratio preserved.
 * On load error, renders fallback (e.g. text title) to avoid broken image.
 */
export function HeroLogo({ url, alt = 'Divine Timing logo', fallback }: HeroLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed && fallback) return <>{fallback}</>;

  return (
    <motion.div
      className="relative w-full max-w-[min(90vw,1200px)] flex justify-center items-center"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Image
        src={url}
        alt={alt}
        width={1200}
        height={400}
        className="object-contain w-auto h-[56px] md:h-[88px] max-h-[56px] md:max-h-[88px]"
        sizes="(max-width: 768px) 600px, 1200px"
        priority
        unoptimized={url.includes('ucarecdn')}
        onError={() => setFailed(true)}
      />
    </motion.div>
  );
}
