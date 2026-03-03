'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MemberLineProps {
  member1Name?: string;
  member2Name?: string;
  /** Delay before fade-in (ms) */
  delay?: number;
}

/**
 * Luxury "By X & Y" line for hero. Smaller, muted, carefully spaced.
 */
export function MemberLine({
  member1Name,
  member2Name,
  delay = 0.2,
}: MemberLineProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);
  const name1 = member1Name?.trim() || 'Lex Laurence';
  const name2 = member2Name?.trim() || 'Liam Bongo';
  const text = `By ${name1} & ${name2}`;

  return (
    <motion.p
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.4, 0, 0.2, 1] }}
      className="text-white/70 text-sm md:text-base tracking-[var(--letter-spacing-wide)] mt-4 md:mt-5 max-w-md mx-auto hero-text-shadow"
      style={{
        fontFamily: 'var(--font-ui)',
        lineHeight: 1.5,
      }}
    >
      {text}
    </motion.p>
  );
}
