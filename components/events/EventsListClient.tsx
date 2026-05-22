'use client';

import { useState } from 'react';
import { EventCard } from '@/components/events/EventCard';
import type { Event } from '@/lib/types/content';
import { LuxuryTabs } from '@/components/ui/LuxuryTabs';

interface EventsListClientProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export function EventsListClient({ upcomingEvents, pastEvents }: EventsListClientProps) {
  const [active, setActive] = useState<'upcoming' | 'past'>('upcoming');
  const events = active === 'upcoming' ? upcomingEvents : pastEvents;
  const isPast = active === 'past';

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    ...(pastEvents.length > 0 ? [{ id: 'past', label: 'Past' }] : []),
  ];

  return (
    <div className="w-full max-w-full">
      {tabs.length > 1 && (
        <div className="flex justify-center mb-10">
          <LuxuryTabs
            tabs={tabs}
            activeId={active}
            onChange={(id) => setActive(id as 'upcoming' | 'past')}
          />
        </div>
      )}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
          {events.map((event) => (
            <EventCard key={event.id} event={event} isPast={isPast} />
          ))}
        </div>
      ) : (
        <div className="text-center text-[var(--text-muted)] py-20 md:py-24">
          <p className="type-body leading-relaxed max-w-[40ch] mx-auto">
            {active === 'upcoming' ? 'No upcoming events. Check back soon.' : 'No past events.'}
          </p>
        </div>
      )}
    </div>
  );
}
