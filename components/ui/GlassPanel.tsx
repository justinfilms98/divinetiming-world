'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlassPanel({ children, className = '', delay = 0 }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`
        bg-[var(--bg)]/80 backdrop-blur-xl
        border border-[var(--accent)]/20
        rounded-2xl
        shadow-lg
        p-8 md:p-12
        max-w-4xl mx-auto
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
