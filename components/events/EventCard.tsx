'use client';

import type { Event } from '@/lib/types/content';
import { MediaAssetRenderer, MediaUnavailableFallback } from '@/components/ui/MediaAssetRenderer';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: Event;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventCard({ event }: EventCardProps) {
  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col md:flex-row gap-6 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="md:w-48 md:flex-shrink-0">
        {event.thumbnail_url ? (
          <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden bg-white/5">
            <MediaAssetRenderer
              url={event.thumbnail_url}
              mediaType="image"
              alt={title}
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                  <span className="text-white/30 text-4xl font-light">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).charAt(0)}
                  </span>
                </div>
              }
              errorFallback={MediaUnavailableFallback}
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
        ) : (
          <div className="aspect-video md:aspect-square rounded-xl bg-white/5 flex items-center justify-center">
            <span className="text-white/30 text-4xl font-light">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[var(--accent)] text-sm font-semibold tracking-wider uppercase">
            {formatDate(event.date)}
            {event.time && ` · ${event.time}`}
          </div>
          <h3 className="text-2xl font-semibold text-white mt-1">{title}</h3>
          <p className="text-white/70 mt-1">{location}</p>
          {event.description && (
            <p className="text-white/60 text-sm mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        {event.ticket_url && (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-center px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent2)] transition-colors font-medium glow"
          >
            Tickets
          </a>
        )}
      </div>
    </motion.article>
  );
}
