'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/ui/reducedMotion';
import { cn } from '@/lib/ui/cn';

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that adds subtle lift + shadow on hover. Disables transform when reduced motion.
 */
export function HoverCard({ children, className }: HoverCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-shadow duration-300',
        !reduce && 'hover:border-white/20 hover:shadow-lg hover:shadow-black/20',
        className
      )}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
