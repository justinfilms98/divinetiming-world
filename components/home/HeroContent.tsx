'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface HeroContentProps {
  headline?: string | null;
  subtext?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
}

export function HeroContent({ headline, subtext, ctaText, ctaUrl }: HeroContentProps) {
  if (!headline && !subtext && !ctaText) return null;

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-4 mt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-4xl">
        {headline && (
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-4">
            {headline}
          </h1>
        )}
        {subtext && (
          <p className="text-xl md:text-2xl text-white/80 mb-8 font-light tracking-wide">
            {subtext}
          </p>
        )}
        {ctaText && ctaUrl && (
          <Link
            href={ctaUrl}
            className="inline-block px-8 py-4 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent2)] transition-colors font-semibold text-lg glow"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
