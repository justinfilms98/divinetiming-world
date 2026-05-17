'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';
import type { PlatformLinkOverrides } from '@/lib/platformLinks';

interface HeroPlatformRowProps {
  /** Optional overrides (e.g. siteSettings) for platform URLs */
  overrides?: PlatformLinkOverrides | null;
  /** Animation delay in seconds */
  delay?: number;
}

/**
 * Minimal platform icon row for hero. Luxury: small icon buttons, subtle border, hover states.
 */
export function HeroPlatformRow({ overrides, delay = 0.35 }: HeroPlatformRowProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const links = getPlatformLinks(overrides ?? undefined);
  if (links.length === 0) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-wrap justify-center gap-3 mt-6 md:mt-8"
      role="group"
      aria-label="Listen on streaming platforms"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl border border-white/25 bg-white/5 text-white/90 hover:bg-white/15 hover:border-white/40 hover:text-white transition-all duration-200 focus-ring active:scale-[0.97]"
          aria-label={`Listen on ${link.label}`}
        >
          <PlatformIcon id={link.id} className="w-5 h-5" />
        </a>
      ))}
    </motion.div>
  );
}
