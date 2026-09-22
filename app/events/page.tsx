import { getEventsSplitByDate, getHeroSection, getPageSettings } from '@/lib/content/server';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Reveal } from '@/components/motion/Reveal';
import { EventCard } from '@/components/events/EventCard';
import { PastEventsList } from '@/components/events/PastEventsList';
import { SectionHeading } from '@/components/home/SectionHeading';
import { SectionCta } from '@/components/home/SectionCta';
import { Container } from '@/components/ui/Container';
import { eventJsonLd } from '@/lib/seo/jsonld';
import { eventDetailHref } from '@/lib/eventDetailHref';
import { touringSummary } from '@/lib/events/display';
import { absoluteImageUrl, BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';
import type { Event } from '@/lib/types/content';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live',
  description:
    'DIVINE:TIMING live — upcoming tour dates, tickets, and the rooms and festivals we have already played.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Live | Divine Timing',
    description:
      'DIVINE:TIMING live — upcoming tour dates, tickets, and the rooms and festivals we have already played.',
    url: '/events',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live | Divine Timing',
    description:
      'DIVINE:TIMING live — upcoming tour dates, tickets, and the rooms and festivals we have already played.',
    images: [DEFAULT_OG_IMAGE],
  },
};

/** One MusicEvent per upcoming date, wrapped in an ItemList so a list page can carry them. */
function upcomingItemListJsonLd(events: Event[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} — upcoming dates`,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: eventJsonLd({
        name: event.title ?? event.city,
        startDate: event.date,
        location: {
          name: event.venue,
          city: event.city,
          country: event.country,
          url: event.venue_url,
        },
        description: event.description ?? undefined,
        url: `${BASE_URL}${eventDetailHref(event)}`,
        image: absoluteImageUrl(event.resolved_thumbnail_url ?? event.thumbnail_url),
        bookingStatus: event.booking_status,
        ticketUrl: event.ticket_url,
        performerName: SITE_NAME,
      }),
    })),
  };
}

export default async function EventsPage() {
  const [{ upcoming, past }, heroSection, pageSettings] = await Promise.all([
    getEventsSplitByDate(),
    getHeroSection('events'),
    getPageSettings('events'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Live';
  const subtext = stripArtistBylineFromHeroSubtext(heroSection?.subtext);
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  const summary = touringSummary(past);

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip">
      {upcoming.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(upcomingItemListJsonLd(upcoming)) }}
        />
      )}

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

      {/* Upcoming leads: the only part of this page that can convert today. */}
      <section className="band-sand" id="upcoming">
        <Container className="section-padding">
          <Reveal>
            <SectionHeading
              label="Upcoming"
              title="Next dates"
              intro={
                upcoming.length > 0
                  ? 'Tickets go through the promoter or venue for each date.'
                  : undefined
              }
            />
          </Reveal>

          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-10">
              {upcoming.map((event, index) => (
                <Reveal key={event.id} delay={index * 0.04}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-8">
              <p className="type-body text-[var(--text-muted)] prose-readability">
                No dates announced right now. New shows are posted here first.
              </p>
              <SectionCta href="/booking" className="mt-8">
                Enquire about booking
              </SectionCta>
            </Reveal>
          )}
        </Container>
      </section>

      {/* Past dates are the booking pitch: rooms played, not dead listings. */}
      {past.length > 0 && (
        <section className="band-night relative overflow-hidden" id="past">
          <div className="hero-grain" aria-hidden />
          <Container className="relative section-padding">
            <Reveal>
              <SectionHeading
                label="Touring history"
                title="Where we've played"
                intro={
                  summary
                    ? `${summary} — and counting. Every date below was a real room.`
                    : 'Previous dates, kept on the record.'
                }
              />
            </Reveal>

            <PastEventsList events={past} />

            <Reveal className="mt-14">
              <SectionCta href="/booking" variant="secondary">
                Book DIVINE:TIMING
              </SectionCta>
            </Reveal>
          </Container>
        </section>
      )}
    </div>
  );
}
