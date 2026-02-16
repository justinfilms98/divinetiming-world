'use client';

import Image from 'next/image';
import { Reveal } from '@/components/motion/Reveal';
import type { PressLogo } from '@/lib/authority-config';
import { cn } from '@/lib/ui/cn';

interface PressLogosRowProps {
  logos: PressLogo[];
  title?: string;
  className?: string;
}

export function PressLogosRow({ logos, title = 'Featured in', className }: PressLogosRowProps) {
  if (!logos?.length) return null;

  return (
    <Reveal className={cn('py-12 px-4', className)}>
      <p className="text-center text-xs uppercase tracking-widest text-white/50 mb-8">{title}</p>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
        {logos.map((logo, i) => {
          const Wrapper = logo.url ? 'a' : 'div';
          const props = logo.url
            ? { href: logo.url, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <Wrapper
              key={i}
              className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 h-8 w-24 relative"
              {...props}
            >
              <Image
                src={logo.logo_url}
                alt={logo.name}
                fill
                className="object-contain"
                sizes="96px"
              />
            </Wrapper>
          );
        })}
      </div>
    </Reveal>
  );
}
