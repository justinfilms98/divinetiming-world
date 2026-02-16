'use client';

import Image from 'next/image';
import { Reveal } from '@/components/motion/Reveal';
import type { CollabItem } from '@/lib/authority-config';
import { cn } from '@/lib/ui/cn';

interface CollabsGridProps {
  collabs: CollabItem[];
  title?: string;
  className?: string;
}

export function CollabsGrid({ collabs, title = 'With', className }: CollabsGridProps) {
  if (!collabs?.length) return null;

  return (
    <Reveal className={cn('py-12 px-4', className)}>
      <p className="text-center text-xs uppercase tracking-widest text-white/50 mb-8">{title}</p>
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {collabs.map((c, i) => {
          const Wrapper = c.url ? 'a' : 'div';
          const props = c.url ? { href: c.url, target: '_blank', rel: 'noopener noreferrer' } : {};
          return (
            <Wrapper
              key={i}
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
              {...props}
            >
              {c.image_url ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/20">
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                  {c.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium">{c.name}</span>
            </Wrapper>
          );
        })}
      </div>
    </Reveal>
  );
}
