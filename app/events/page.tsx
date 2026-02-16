import { getEvents, getHeroSection, getPageSettings } from '@/lib/content';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { EventCard } from '@/components/events/EventCard';
import { Reveal } from '@/components/motion/Reveal';
import { EventsListClient } from '@/components/events/EventsListClient';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const [allEvents, heroSection, pageSettings] = await Promise.all([
    getEvents(),
    getHeroSection('events'),
    getPageSettings('events'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Events';
  const subtext = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  const now = new Date();
  const upcomingEvents = (allEvents || []).filter((e) => new Date(e.date) >= now);
  const pastEvents = (allEvents || []).filter((e) => new Date(e.date) < now).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={subtext ?? undefined}
        heightPreset="standard"
        showScrollCue
      />

      <section className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="section-label text-center mb-10">
              DIVINE:TIMING / EVENTS
            </p>
            <EventsListClient
              upcomingEvents={upcomingEvents}
              pastEvents={pastEvents}
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
