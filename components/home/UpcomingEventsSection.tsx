import type { Event } from '@/lib/types/content';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { EventCard } from '@/components/events/EventCard';
import { SectionHeading } from './SectionHeading';
import { SectionCta } from './SectionCta';

interface UpcomingEventsSectionProps {
  events: Event[];
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <section className="band-sand">
      <Container className="section-padding">
        <Reveal>
          <SectionHeading label="Live dates" title="Where we'll be next" />
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <Reveal className="mt-10">
          <SectionCta href="/events" variant="secondary">
            All dates
          </SectionCta>
        </Reveal>
      </Container>
    </section>
  );
}
