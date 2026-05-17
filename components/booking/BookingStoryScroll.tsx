'use client';

import { Reveal } from '@/components/motion/Reveal';
import type { BookingContentSection } from '@/lib/types/content';
import { StarsMotif, ClockMotif, SunsetMotif } from './motifs';

interface BookingStoryScrollProps {
  sections: BookingContentSection[];
}

function getAlign(index: number, preference?: string | null): 'left' | 'right' {
  if (preference === 'left') return 'left';
  if (preference === 'right') return 'right';
  return index % 2 === 0 ? 'left' : 'right';
}

export function BookingStoryScroll({ sections }: BookingStoryScrollProps) {
  if (!sections.length) return null;

  return (
    <section className="relative py-12 md:py-16 px-4 overflow-x-clip overflow-y-visible min-w-0" aria-label="Our story">
      <div className="absolute inset-0 overflow-hidden pointer-events-none text-[var(--accent)]/70" aria-hidden="true">
        <StarsMotif />
        <ClockMotif />
        <SunsetMotif />
      </div>

      <div className="relative max-w-4xl mx-auto space-y-16 md:space-y-20 min-w-0">
        {sections.map((section, index) => {
          const align = getAlign(index, section.align_preference);
          const heading = section.title || '';
          const body = section.description || '';

          return (
            <Reveal
              key={section.id}
              variant="fadeUp"
              delay={index * 0.08}
              once
              amount={0.15}
              className={`flex flex-col min-w-0 ${align === 'right' ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}
            >
              <article className="w-full max-w-2xl min-w-0">
                {heading && (
                  <div className="max-w-[65ch]">
                    <h2
                      className="type-h2 text-[var(--text)] mb-3 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {heading}
                    </h2>
                  </div>
                )}
                {body && (
                  <div className="max-w-[65ch] space-y-4">
                    {(body.trim().split(/\n\n+/).filter(Boolean).length
                      ? body.trim().split(/\n\n+/).filter(Boolean)
                      : [body]
                    ).map((para, i) => (
                      <p
                        key={i}
                        className="type-body text-[var(--text-muted)] leading-relaxed"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {para.replace(/\n/g, ' ').trim()}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
