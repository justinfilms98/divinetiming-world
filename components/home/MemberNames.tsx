'use client';

import { motion } from 'framer-motion';

interface MemberNamesProps {
  member1Name?: string;
  member2Name?: string;
}

export function MemberNames({ member1Name, member2Name }: MemberNamesProps) {
  if (!member1Name && !member2Name) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 text-center text-base md:text-lg lg:text-xl text-white font-bold tracking-tight uppercase"
      style={{ 
        fontFamily: 'var(--font-playfair-display), serif',
        textShadow: `
          0.5px 0.5px 0 rgba(255, 0, 150, 0.3),
          -0.5px -0.5px 0 rgba(0, 255, 255, 0.3),
          1px 0 0 rgba(255, 0, 150, 0.2),
          -1px 0 0 rgba(0, 255, 255, 0.2)
        `
      }}
    >
      by {member2Name?.toUpperCase() || 'LIAM BONGO'} & {member1Name?.toUpperCase() || 'LEX LAURENCE'}
    </motion.p>
  );
}
