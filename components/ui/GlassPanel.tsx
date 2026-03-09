'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useReducedMotion } from '@/lib/ui/reducedMotion';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlassPanel({ children, className = '', delay = 0 }: GlassPanelProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25, delay: reduce ? 0 : delay, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative overflow-hidden
        bg-[var(--bg)]/80 backdrop-blur-xl
        border border-[var(--accent)]/20
        rounded-2xl
        shadow-lg
        p-8 md:p-12
        max-w-4xl mx-auto
        card-atmosphere
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
