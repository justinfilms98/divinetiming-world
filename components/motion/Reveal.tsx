'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, reducedMotionVariants } from '@/lib/ui/reducedMotion';
import { fadeUp, viewportDefaults, defaultTransition } from '@/lib/ui/motion';
import { cn } from '@/lib/ui/cn';

type Variant = 'fadeUp' | 'fade' | 'fadeDown';

interface RevealProps {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  staggerChildren?: boolean;
  once?: boolean;
  amount?: number;
  className?: string;
}

const scrollRevealTransition = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };

const variantMap = {
  fadeUp: { ...fadeUp, transition: scrollRevealTransition },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: defaultTransition },
  fadeDown: {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: defaultTransition,
  },
};

/**
 * Renders stable markup on server and first client paint to avoid hydration mismatch.
 * Motion is enabled only after mount so initial/animate never differ between server and client.
 */
export function Reveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  once = viewportDefaults.once,
  amount = viewportDefaults.amount,
  className,
}: RevealProps) {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const variants = reduce ? reducedMotionVariants.fadeUpSafe : variantMap[variant];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server and first client paint: same static wrapper (no animated inline styles).
  if (!mounted) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount }}
      variants={variants}
      transition={{ ...defaultTransition, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
