'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface HeroContentProps {
  headline?: string | null;
  subtext?: string | null;
  /** Primary CTA (e.g. Listen Now) */
  ctaText?: string | null;
  ctaUrl?: string | null;
  /** Secondary CTA (e.g. Booking) */
  secondaryCtaText?: string | null;
  secondaryCtaUrl?: string | null;
}

export function HeroContent({
  headline,
  subtext,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
}: HeroContentProps) {
  if (!headline && !subtext && !ctaText && !secondaryCtaText) return null;

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
        <div className="flex flex-wrap justify-center gap-4">
          {ctaText && ctaUrl && (
            <Link
              href={ctaUrl}
              className="inline-block px-8 py-4 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent2)] transition-colors font-semibold text-lg glow focus-ring"
            >
              {ctaText}
            </Link>
          )}
          {secondaryCtaText && secondaryCtaUrl && (
            <Link
              href={secondaryCtaUrl}
              className="inline-block px-8 py-4 border border-white/30 text-white rounded-md font-medium hover:bg-white/10 transition-colors duration-250 ease-out focus-ring"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
