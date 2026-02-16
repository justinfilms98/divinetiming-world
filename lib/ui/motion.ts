/**
 * Motion presets — durations, easings, variants for Framer Motion.
 * Use with reducedMotion helper for safe fallbacks.
 */

export const durations = {
  fast: 0.15,
  med: 0.3,
  slow: 0.5,
} as const;

export const easings = {
  standard: [0.33, 1, 0.68, 1] as const,
  emphasize: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

/** Light blur-in (use filter only when reduced motion is off) */
export const blurIn = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
};

export const defaultTransition = {
  duration: durations.med,
  ease: easings.standard,
};

export const viewportDefaults = {
  once: true,
  amount: 0.2,
} as const;

/** Stagger container: use with variants that have transition.staggerChildren */
export const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  hidden: {},
};

/** Stagger child: use with staggerContainer */
export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};
