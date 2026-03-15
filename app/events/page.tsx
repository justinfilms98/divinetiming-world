import { getEvents, getHeroSection, getPageSettings } from '@/lib/content/server';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Reveal } from '@/components/motion/Reveal';
import { EventsListClient } from '@/components/events/EventsListClient';
import { Section } from '@/components/ui/Section';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and past Divine Timing events, tour dates, and shows.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Events | Divine Timing',
    description: 'Upcoming and past Divine Timing events, tour dates, and shows.',
    url: '/events',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events | Divine Timing',
    description: 'Upcoming and past Divine Timing events, tour dates, and shows.',
  },
};

export default async function EventsPage() {
  const [allEvents, heroSection, pageSettings] = await Promise.all([
    getEvents(),
    getHeroSection('events'),
    getPageSettings('events'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Events';
  const subtext = stripArtistBylineFromHeroSubtext(heroSection?.subtext);
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
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
        showScrollCue
      />

      <Section className="flex-1 mt-20 overflow-x-clip section-lift py-14 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 w-full min-w-0">
          <div className="w-full">
            <Reveal>
              <p className="text-center text-[var(--text-muted)] type-body mb-12 md:mb-14 max-w-[45ch] mx-auto leading-relaxed">
                Upcoming and past shows.
              </p>
              <EventsListClient
                upcomingEvents={upcomingEvents}
                pastEvents={pastEvents}
              />
            </Reveal>
          </div>
        </div>
      </Section>
    </div>
  );
}
