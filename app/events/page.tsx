import { getEvents, getHeroSection, getPageSettings } from '@/lib/content';
import { EventsHero } from '@/components/events/EventsHero';
import { EventCard } from '@/components/events/EventCard';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const [events, heroSection, pageSettings] = await Promise.all([
    getEvents({ upcomingOnly: true }),
    getHeroSection('events'),
    getPageSettings('events'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Events';
  const subtext = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Full-width hero banner with rounded lower corners */}
      <EventsHero
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={subtext}
      />

      {/* Event grid below hero */}
      <section className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {events && events.length > 0 ? (
            <div className="space-y-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/70 py-16">
              <p className="text-lg">No upcoming events. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
