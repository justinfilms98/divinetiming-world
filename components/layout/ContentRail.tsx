'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

/** Single source of truth for public page content width. Inner content is centered so the block never drifts left. */
const RAIL_CLASS = 'max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 w-full min-w-0';

export function ContentRail({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'main' | 'section';
}) {
  const Comp = Tag;
  return (
    <Comp className={cn(RAIL_CLASS, className)}>
      <div className="w-full flex flex-col items-center">
        {children}
      </div>
    </Comp>
  );
}

export const contentRailClass = RAIL_CLASS;
