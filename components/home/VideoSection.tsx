'use client';

import { motion } from 'framer-motion';

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url?: string;
}

interface VideoSectionProps {
  video: Video | null;
}

export function VideoSection({ video }: VideoSectionProps) {
  if (!video) {
    return null;
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-8 text-center"
        >
          Latest Video
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          className="relative aspect-video bg-[var(--bg2)] rounded-lg overflow-hidden"
        >
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mt-6"
        >
          <a
            href="/media"
            className="text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 font-semibold"
          >
            View All Videos →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
