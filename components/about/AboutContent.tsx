'use client';

import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/home/SectionHeading';
import { SectionCta } from '@/components/home/SectionCta';
import type { AboutPhoto, AboutTimelineItem } from '@/lib/types/content';

interface AboutContentProps {
  /** Public short bio (press kit). Omit the section when empty. */
  shortBio: string | null;
  /** True when a long press bio exists — never dump it here; link to the press kit. */
  hasLongBio: boolean;
  /**
   * Optional extra about-page story (about_content). Only shown when a short
   * bio is already featured, so the long press bio is never the only copy.
   */
  extraHtml?: string | null;
  photos: AboutPhoto[];
  timeline: AboutTimelineItem[];
  member1Name: string;
  member2Name: string;
}

export function AboutContent({
  shortBio,
  hasLongBio,
  extraHtml,
  photos,
  timeline,
  member1Name,
  member2Name,
}: AboutContentProps) {
  const extra = extraHtml?.trim() || null;
  const showExtra = !!(shortBio && extra);
  const hasMembers = !!(member1Name || member2Name);
  const visiblePhotos = photos.filter((p) => p.image_url);

  return (
    <>
      {shortBio && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="About" title="The duo" />
            </Reveal>
            <Reveal className="mt-8 max-w-3xl space-y-5">
              {shortBio.split(/\n\n+/).map((para, i) => (
                <p
                  key={i}
                  className="type-body text-[var(--text)] prose-readability whitespace-pre-line"
                >
                  {para}
                </p>
              ))}
            </Reveal>
            {hasLongBio && (
              <Reveal className="mt-8">
                <SectionCta href="/presskit" variant="secondary">
                  Full press bio
                </SectionCta>
              </Reveal>
            )}
          </Container>
        </section>
      )}

      {showExtra && extra && (
        <section className="band-dune">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="Story" title="More" />
            </Reveal>
            <Reveal className="mt-8 max-w-3xl">
              <div
                className="about-bio-content type-body text-[var(--text)] prose-readability leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[400px] [&_p]:mb-5 [&_ul]:my-5 [&_ol]:my-5 [&_li]:mb-1 [&_a]:underline [&_a]:decoration-[var(--text)]/40 [&_a:hover]:opacity-90"
                dangerouslySetInnerHTML={{ __html: extra }}
              />
            </Reveal>
          </Container>
        </section>
      )}

      {visiblePhotos.length > 0 && (
        <section className="band-night relative overflow-hidden">
          <div className="hero-grain" aria-hidden />
          <Container className="relative section-padding">
            <Reveal>
              <SectionHeading label="Gallery" title="Photos" />
            </Reveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {visiblePhotos.map((photo, i) => (
                <Reveal key={photo.id} delay={i * 0.04}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src={photo.image_url}
                      alt={photo.alt_text?.trim() || 'Divine Timing'}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {hasMembers && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="The band" title="Members" />
            </Reveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {member1Name && (
                <Reveal>
                  <p className="type-h3 text-[var(--accent)]">{member1Name}</p>
                </Reveal>
              )}
              {member2Name && (
                <Reveal delay={0.06}>
                  <p className="type-h3 text-[var(--accent)]">{member2Name}</p>
                </Reveal>
              )}
            </div>
          </Container>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="band-dune">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="History" title="Timeline" />
            </Reveal>
            <div className="relative mt-12">
              <div className="absolute left-0 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)]/50 via-[var(--accent)]/30 to-transparent" />
              <div className="space-y-12 pl-8 md:pl-16">
                {timeline.map((item, i) => (
                  <Reveal key={item.id} delay={i * 0.04} className="relative">
                    <div className="absolute -left-8 md:-left-16 top-1 w-4 h-4 rounded-full bg-[var(--accent)]" />
                    <p className="text-[var(--accent)] type-body font-semibold tracking-wider mb-2">
                      {item.year}
                    </p>
                    <h3 className="type-h3 text-[var(--text)] mb-3">{item.title}</h3>
                    {item.description && (
                      <p className="type-body text-[var(--text-muted)] prose-readability">
                        {item.description}
                      </p>
                    )}
                  </Reveal>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal className="max-w-xl mx-auto text-center">
            <SectionHeading
              align="center"
              label="Press & promoters"
              title={hasLongBio ? 'Press kit' : 'Media resources'}
            />
            <div className="mt-8 flex justify-center">
              <SectionCta href="/presskit">
                {hasLongBio ? 'Read the full press bio' : 'Press kit'}
              </SectionCta>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
