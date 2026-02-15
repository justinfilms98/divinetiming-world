'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/ui/reducedMotion';
import { fade, defaultTransition } from '@/lib/ui/motion';
import { cn } from '@/lib/ui/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Wraps public page content with a subtle fade. Stable on first paint to avoid hydration mismatch. */
export function PageTransition({ children, className }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const variants = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : fade;

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
      transition={defaultTransition}
      className={cn('min-h-0', className)}
    >
      {children}
    </motion.div>
  );
}
