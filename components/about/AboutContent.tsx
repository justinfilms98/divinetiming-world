'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import type { AboutPhoto, AboutTimelineItem } from '@/lib/types/content';

interface AboutContentProps {
  /** Short brand statement (e.g. from hero subtext) */
  brandStatement?: string | null;
  bioText: string;
  /** Sanitized HTML from DB; when present, used instead of bioText */
  bioHtml?: string | null;
  photos: AboutPhoto[];
  timeline: AboutTimelineItem[];
  member1Name: string;
  member2Name: string;
}

export function AboutContent({
  brandStatement,
  bioText,
  bioHtml,
  photos,
  timeline,
  member1Name,
  member2Name,
}: AboutContentProps) {
  const bioParagraphs = bioText ? bioText.split('\n\n').filter(Boolean) : [];
  const useRichBio = bioHtml != null && bioHtml.trim() !== '';

  return (
    <Container className="py-16 md:py-24">
      {/* Brand statement */}
      {brandStatement && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-3xl mx-auto text-center mb-20 md:mb-28"
        >
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed font-light" style={{ fontFamily: 'var(--font-playfair-display), serif' }}>
            {brandStatement}
          </p>
        </motion.section>
      )}

      {/* Story */}
      <section className="mb-20 md:mb-28" aria-labelledby="about-story-heading">
        <h2 id="about-story-heading" className="sr-only">Story</h2>
      {/* Bio with alternating layout when photos exist */}
      {useRichBio ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-8"
        >
          <div
            className="about-bio-content max-w-prose text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed font-light [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[400px] [&_p]:mb-6 [&_ul]:my-6 [&_ol]:my-6 [&_li]:mb-1 [&_a]:underline [&_a]:decoration-white/40 [&_a:hover]:opacity-90"
            style={{ fontFamily: 'var(--font-playfair-display), serif' }}
            dangerouslySetInnerHTML={{ __html: bioHtml }}
          />
        </motion.section>
      ) : (
        bioParagraphs.length > 0 && (
        <section className="space-y-16">
          {photos.length > 0 ? (
            bioParagraphs.map((para, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`flex flex-col gap-8 md:gap-16 ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                } md:items-center`}
              >
                <div className="flex-1">
                  <p
                    className="text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed font-light"
                    style={{ fontFamily: 'var(--font-playfair-display), serif' }}
                  >
                    {para}
                  </p>
                </div>
                {photos[i] && (
                  <div className="relative aspect-[4/3] md:w-2/5 flex-shrink-0 rounded-2xl overflow-hidden">
                    <Image
                      src={photos[i].image_url}
                      alt={photos[i].alt_text || 'About'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-8"
            >
              {bioParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed font-light"
                  style={{ fontFamily: 'var(--font-playfair-display), serif' }}
                >
                  {para}
                </p>
              ))}
            </motion.div>
          )}
        </section>
        )
      )}
      </section>

      {/* Performance identity / sound — optional short mission line */}
      {(bioParagraphs.length > 0 || useRichBio) && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center py-12 border-y border-white/10"
        >
          <p className="text-[var(--text-muted)] type-body italic">
            Live, evolving, in motion — electronic duo for festivals, club nights, and collaborations.
          </p>
        </motion.section>
      )}

      {/* Press kit CTA */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 md:mt-28 text-center"
      >
        <p className="text-white/80 type-body mb-6">Press & promoters</p>
        <Link
          href="/epk"
          className="inline-flex items-center gap-2 px-6 py-4 rounded-[var(--radius-button)] bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/25 transition-colors duration-200 type-button font-medium"
        >
          Download EPK
        </Link>
      </motion.section>

      {/* Remaining photos if more than bio paragraphs */}
      {photos.length > bioParagraphs.length && (
        <section className="mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {photos.slice(bioParagraphs.length).map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden"
              >
                <Image
                  src={photo.image_url}
                  alt={photo.alt_text || 'About'}
                  fill
                  className="object-cover"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      <section className="mt-24 pt-24 border-t border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">
          Members
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-semibold text-[var(--accent)]"
          >
            {member1Name}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-semibold text-[var(--accent)]"
          >
            {member2Name}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      {timeline.length > 0 && (
        <section className="mt-24 pt-24 border-t border-white/10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 tracking-tight">
            Timeline
          </h2>
          <div className="relative">
            <div className="absolute left-0 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)]/50 via-[var(--accent)]/30 to-transparent" />
            <div className="space-y-16 pl-8 md:pl-16">
              {timeline.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  className="relative"
                >
                  <div className="absolute -left-8 md:-left-16 top-1 w-4 h-4 rounded-full bg-[var(--accent)]" />
                  <div className="text-[var(--accent)] text-lg font-semibold tracking-wider mb-2">
                    {item.year}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-white/70 text-lg leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}
    </Container>
  );
}
