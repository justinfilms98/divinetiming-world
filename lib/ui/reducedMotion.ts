'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Returns true when the user prefers reduced motion.
 * Use to disable transforms/scale/parallax and use opacity-only fallbacks.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

/** Safe variants when reduced motion is true: opacity only, no transform/filter */
export const reducedMotionVariants = {
  fadeOnly: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeUpSafe: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};
