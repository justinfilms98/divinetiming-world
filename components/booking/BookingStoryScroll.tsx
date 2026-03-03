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
    <section className="relative py-20 md:py-28 px-4 overflow-x-clip overflow-y-visible" aria-label="Our story">
      <div className="absolute inset-0 overflow-hidden pointer-events-none text-[var(--accent)]" aria-hidden="true">
        <StarsMotif />
        <ClockMotif />
        <SunsetMotif />
      </div>

      <div className="relative max-w-4xl mx-auto space-y-24 md:space-y-32 min-w-0">
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
                  <div className="max-w-[40ch]">
                    <h2
                      className="type-h2 text-[var(--text)] mb-4 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {heading}
                    </h2>
                  </div>
                )}
                {body && (
                  <div className="max-w-[60ch]">
                    <p
                      className="type-body text-[var(--text-muted)] leading-relaxed whitespace-pre-line"
                      style={{ fontFamily: 'var(--font-ui)' }}
                    >
                      {body}
                    </p>
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
