/**
 * Motion presets — durations, easings, variants for Framer Motion.
 * Use with reducedMotion helper for safe fallbacks.
 */

/** Phase 24: small 150–200ms, medium 200–250ms, page ≈250ms; avoid >300ms. */
export const durations = {
  fast: 0.15,
  standard: 0.2,
  med: 0.25,
  slow: 0.3,
} as const;

/** Single easing for consistency: cubic-bezier(0.4, 0, 0.2, 1). */
export const easings = {
  standard: [0.4, 0, 0.2, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  emphasize: [0.34, 1.56, 0.64, 1] as const,
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Subtle fade + 8px up (200–300ms). Use for page/section entrance when reduced motion is off. */
export const fadeUpSubtle = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

/** Phase 24: 8px motion scale (use fadeUpSubtle for page/section). */
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

/** Scroll reveal: ≤250ms, stagger minimal. Phase 30 motion restraint. */
export const scrollRevealTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as const,
};
export const scrollRevealStagger = 0.06;

/** Phase 24: 8px motion scale. */
export const fadeDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
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
  duration: durations.standard,
  ease: easings.standard,
};

export const viewportDefaults = {
  once: true,
  amount: 0.2,
} as const;

/** Stagger container: 80ms stagger, 600ms duration */
export const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  hidden: {},
};

/** Stagger child: use with staggerContainer (8px fade up, Phase 24). */
export const staggerChild = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};
