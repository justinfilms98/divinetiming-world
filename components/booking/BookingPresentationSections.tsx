'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { BookingContentSection } from '@/lib/types/content';

interface BookingPresentationSectionsProps {
  sections: BookingContentSection[];
}

export function BookingPresentationSections({ sections }: BookingPresentationSectionsProps) {
  if (sections.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-20">
        {sections.map((section, index) => (
          <motion.article
            key={section.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col gap-8 md:gap-12 ${
              index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
            } md:items-center`}
          >
            {section.image_url && (
              <div className="relative aspect-video md:aspect-square md:w-1/2 rounded-xl overflow-hidden bg-white/5">
                <Image
                  src={section.image_url}
                  alt={section.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className={`flex-1 ${section.image_url ? 'md:w-1/2' : ''}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                {section.title}
              </h2>
              {section.description && (
                <p className="text-white/70 text-lg leading-relaxed whitespace-pre-line">
                  {section.description}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
