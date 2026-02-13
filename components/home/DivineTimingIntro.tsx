'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface DivineTimingIntroProps {
  artistName: string;
  animationType?: 'warp' | 'clock' | 'none';
  animationEnabled?: boolean;
}

export function DivineTimingIntro({
  artistName,
  animationType = 'warp',
  animationEnabled = true,
}: DivineTimingIntroProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  const useAnimation = animationEnabled && !reducedMotion && animationType !== 'none';
  const nameParts = artistName.split(':');

  return (
    <div className="relative z-10 text-center">
      {/* Warp ripple effect - subtle distortion on load */}
      {useAnimation && animationType === 'warp' && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div
            className="warp-ripple-effect w-[120%] h-[120%] rounded-full border border-[var(--accent)]/10"
            style={{
              boxShadow: '0 0 80px rgba(209, 98, 23, 0.15), inset 0 0 60px rgba(209, 98, 23, 0.05)',
            }}
          />
        </motion.div>
      )}

      {/* Clock/time gradient sweep - radial time gradient */}
      {useAnimation && animationType === 'clock' && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="clock-sweep-effect w-[150%] h-[150%]"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(209, 98, 23, 0.08) 90deg, transparent 180deg)',
            }}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: useAnimation ? 0.92 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: useAnimation ? 0.8 : 0.5,
          ease: 'easeOut',
        }}
        className="relative z-10"
      >
        {useAnimation ? (
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight"
            animate={
              animationType === 'warp'
                ? { scale: [1, 1.02, 1] }
                : animationType === 'clock'
                  ? { opacity: [1, 1] }
                  : {}
            }
            transition={{
              duration: 3,
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
