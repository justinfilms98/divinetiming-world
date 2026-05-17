'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/ui/reducedMotion';
import { fade, fadeUpSubtle, durations, easings } from '@/lib/ui/motion';
import { cn } from '@/lib/ui/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Phase 24: page ≈250ms, single easing. */
const pageTransitionConfig = {
  duration: durations.med,
  ease: easings.standard,
};

/** Wraps public page content with a subtle fade (and slight translateY when motion allowed). Respects prefers-reduced-motion. */
export function PageTransition({ children, className }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const variants = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : fadeUpSubtle;
  const transition = reduce ? { duration: 0.01 } : pageTransitionConfig;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn('min-h-0', className)}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className={cn('min-h-0', className)}
    >
      {children}
    </motion.div>
  );
}
