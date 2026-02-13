'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Event {
  id: string;
  date: string;
  city: string;
  venue: string;
  ticket_url?: string;
}

interface EventsSectionProps {
  events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
  if (events.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-12 text-center"
        >
          Upcoming Events
        </motion.h2>

        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-[var(--bg2)] rounded-lg border border-[var(--accent)]/20 hover:border-[var(--accent)]/40 transition-colors"
            >
              <div>
                <div className="text-[var(--accent)] text-sm font-semibold mb-1">
                  {formatDate(event.date)}
                </div>
                <div className="text-xl font-semibold text-[var(--text)] mb-1">
                  {event.city}
                </div>
                <div className="text-[var(--text)]/70">
                  {event.venue}
                </div>
              </div>

              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 md:mt-0 px-6 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow"
                >
                  Tickets
                </a>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/events"
            className="text-[var(--accent)] hover:text-[var(--accent2)] transition-colors font-semibold"
          >
            View All Events →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
