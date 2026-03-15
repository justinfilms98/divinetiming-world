'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

/** Charter: canonical content grid. Use for product grids, gallery grids, card layouts. */
interface GridProps {
  children: ReactNode;
  className?: string;
  /** 1–4 cols; default 3. */
  cols?: 1 | 2 | 3 | 4;
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function Grid({ children, className, cols = 3 }: GridProps) {
  return (
    <div
      className={cn('grid gap-8 md:gap-10 items-start', colClasses[cols], className)}
      role="list"
    >
      {children}
    </div>
  );
}
