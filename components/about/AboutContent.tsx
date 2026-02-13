'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { AboutPhoto, AboutTimelineItem } from '@/lib/types/content';

interface AboutContentProps {
  bioText: string;
  photos: AboutPhoto[];
  timeline: AboutTimelineItem[];
  member1Name: string;
  member2Name: string;
}

export function AboutContent({
  bioText,
  photos,
  timeline,
  member1Name,
  member2Name,
}: AboutContentProps) {
  const bioParagraphs = bioText ? bioText.split('\n\n').filter(Boolean) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      {/* Bio with alternating layout when photos exist */}
      {bioParagraphs.length > 0 && (
        <section className="space-y-16">
          {photos.length > 0 ? (
            bioParagraphs.map((para, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5 }}
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
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
      )}

      {/* Remaining photos if more than bio paragraphs */}
      {photos.length > bioParagraphs.length && (
        <section className="mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {photos.slice(bioParagraphs.length).map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
    </div>
  );
}
