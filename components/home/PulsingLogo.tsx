'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PulsingLogoProps {
  artistName: string;
  member1Name?: string;
  member2Name?: string;
}

export function PulsingLogo({ artistName, member1Name, member2Name }: PulsingLogoProps) {
  const [showNav, setShowNav] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // After pulse animation, reveal nav
    if (!reducedMotion) {
      const timer = setTimeout(() => setShowNav(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowNav(true);
    }
  }, [reducedMotion]);

  const nameParts = artistName.split(':');

  return (
    <div className="relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-4"
      >
        {!reducedMotion ? (
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {nameParts.length > 1 ? (
              <>
                <span className="block">{nameParts[0]}</span>
                <span className="block text-[var(--accent)]">:{nameParts[1]}</span>
              </>
            ) : (
              <span>{artistName}</span>
            )}
          </motion.h1>
        ) : (
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight">
            {nameParts.length > 1 ? (
              <>
                <span className="block">{nameParts[0]}</span>
                <span className="block text-[var(--accent)]">:{nameParts[1]}</span>
              </>
            ) : (
              <span>{artistName}</span>
            )}
          </h1>
        )}
      </motion.div>
    </div>
  );
}
