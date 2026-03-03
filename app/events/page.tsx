import { getEvents, getHeroSection, getPageSettings } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { EventCard } from '@/components/events/EventCard';
import { Reveal } from '@/components/motion/Reveal';
import { EventsListClient } from '@/components/events/EventsListClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and past Divine Timing events, tour dates, and shows.',
  openGraph: { title: 'Events | Divine Timing', description: 'Upcoming and past Divine Timing events, tour dates, and shows.' },
  twitter: { card: 'summary_large_image', title: 'Events | Divine Timing' },
};

export default async function EventsPage() {
  const [allEvents, heroSection, pageSettings] = await Promise.all([
    getEvents(),
    getHeroSection('events'),
    getPageSettings('events'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Events';
  const subtext = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  const now = new Date();
  const upcomingEvents = (allEvents || []).filter((e) => new Date(e.date) >= now);
  const pastEvents = (allEvents || []).filter((e) => new Date(e.date) < now).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={subtext ?? undefined}
        heightPreset="compact"
        showScrollCue
      />

      <section className="flex-1 section-padding overflow-x-clip">
        <div className="content-width px-6 min-w-0">
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
