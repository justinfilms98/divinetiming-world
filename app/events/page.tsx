import { getEvents, getHeroSection, getPageSettings } from '@/lib/content/server';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Reveal } from '@/components/motion/Reveal';
import { EventsListClient } from '@/components/events/EventsListClient';
import { Container } from '@/components/ui/Container';
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

      <Section className="flex-1 mt-20 overflow-x-clip section-lift">
        <Container className="min-w-0">
          <Reveal>
            <p className="text-center text-[var(--text-muted)] type-body mb-10 max-w-[45ch] mx-auto">
              Upcoming and past shows.
            </p>
            <EventsListClient
              upcomingEvents={upcomingEvents}
              pastEvents={pastEvents}
            />
          </Reveal>
        </Container>
      </Section>
    </div>
  );
}
