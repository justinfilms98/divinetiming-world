'use client';

import { Reveal } from '@/components/motion/Reveal';
import type { AuthorityStat } from '@/lib/authority-config';
import { cn } from '@/lib/ui/cn';

interface StatsRowProps {
  stats: AuthorityStat[];
  className?: string;
}

export function StatsRow({ stats, className }: StatsRowProps) {
  if (!stats?.length) return null;

  return (
    <Reveal className={cn('py-12 md:py-16 px-4', className)}>
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-6">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--accent)] tracking-tight">
              {s.value}
            </div>
            <div className="text-sm uppercase tracking-widest text-white/60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
