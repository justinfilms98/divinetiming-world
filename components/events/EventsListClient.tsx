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

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    ...(pastEvents.length > 0 ? [{ id: 'past', label: 'Past' }] : []),
  ];

  return (
    <div>
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
        <div className="space-y-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center text-white/70 py-16">
          <p className="text-lg">
            {active === 'upcoming' ? 'No upcoming events. Check back soon.' : 'No past events.'}
          </p>
        </div>
      )}
    </div>
  );
}
