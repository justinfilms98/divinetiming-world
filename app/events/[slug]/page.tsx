import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ContentRail } from '@/components/layout/ContentRail';
import { getEventBySlug, getEventMedia, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { EventDetailCard } from '@/components/events/EventDetailCard';
import { MediaMasonry, type MasonryItem } from '@/components/media/MediaMasonry';
import { absoluteImageUrl, BASE_URL } from '@/lib/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const event = await getEventBySlug(resolved.slug);
  if (!event) return { title: 'Event' };
  const title = event.title ?? event.city ?? 'Event';
  const location = [event.venue, event.city].filter(Boolean).join(', ');
  const description = location ? `${title} — ${location}` : undefined;
  const slugOrId = event.slug || event.id;
  const path = `/events/${slugOrId}`;
  const ogImage = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;
  const ogImageUrl = absoluteImageUrl(ogImage);

  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Divine Timing`,
      description: description ?? undefined,
      url: path,
      type: 'website',
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Divine Timing`,
      description: description ?? undefined,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slugOrId = resolved.slug;
  if (!slugOrId) {
    notFound();
  }
  const [event, eventsHero] = await Promise.all([
    getEventBySlug(slugOrId),
    getHeroSection('events'),
  ]);

  if (!event) {
    notFound();
  }

  const eventMedia = await getEventMedia(event.id);

  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;
  const imageUrl = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;
  const heroMediaUrl = imageUrl ?? eventsHero?.mediaFinalUrl ?? undefined;
  const heroMediaType = imageUrl ? 'image' : (eventsHero?.media_type ?? undefined);

  const sharePath = `/events/${event.slug || event.id}`;
  const isPast = new Date(event.date) < new Date();

  const descriptionParagraphs = event.description
    ? event.description.split(/\n\n+/).filter(Boolean)
    : [];

  const masonryItems: MasonryItem[] = eventMedia
    .filter((m) => m.resolved_url)
    .map((m) => ({
      id: m.id,
      url: m.resolved_url!,
      mediaType: m.media_type,
      caption: m.caption,
      posterUrl: m.thumbnail_url,
    }));

  const eventStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    startDate: event.date,
    ...(event.description && { description: event.description }),
    ...(imageUrl && { image: absoluteImageUrl(imageUrl) }),
    ...((event.venue || event.city) && {
      location: {
        '@type': 'Place',
        name: event.venue || event.city || undefined,
        address: event.city ? { '@type': 'PostalAddress', addressLocality: event.city } : undefined,
      },
    }),
    url: `${BASE_URL}${sharePath}`,
  };

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData) }}
      />

      {/* Full-bleed hero with event title centered */}
      <UnifiedHero
        mediaUrl={heroMediaUrl}
        mediaType={heroMediaType}
        overlayOpacity={Number(eventsHero?.overlay_opacity ?? 0.55)}
        badge={eventsHero?.label_text?.trim() || undefined}
        headline={title}
        subtext={location}
        heightPreset="standard"
      />

      <main className="flex-1 pt-16 md:pt-24 pb-20 min-w-0">
        <ContentRail>
          <div className="w-full max-w-6xl mx-auto">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded nav-link-underline"
            >
              ← Back to Events
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start">
              <article className="min-w-0 space-y-8">
                {imageUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--accent)]/10 shadow-[var(--shadow-card)]">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      priority
                    />
                  </div>
                )}

                {event.description && (
                  <div className="leading-relaxed space-y-5 text-[var(--text)] type-body" style={{ fontFamily: 'var(--font-body)' }}>
                    {descriptionParagraphs.length > 0 ? (
                      descriptionParagraphs.map((para, i) => (
                        <p key={i} className="whitespace-pre-line">
                          {para}
                        </p>
                      ))
                    ) : (
                      <p className="whitespace-pre-line">{event.description}</p>
                    )}
                  </div>
                )}
              </article>

              <div className="lg:sticky lg:top-28 lg:min-w-0">
                <EventDetailCard event={event} sharePath={sharePath} />
              </div>
            </div>

            {masonryItems.length > 0 && (
              <section className="mt-20 md:mt-28">
                <div className="text-center mb-10 md:mb-14">
                  <p className="type-label text-[var(--accent)] tracking-[0.25em]">
                    {isPast ? 'FROM THE NIGHT' : 'BEHIND THE SHOW'}
                  </p>
                  <h2 className="type-h2 text-[var(--text)] mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {isPast ? 'Recap' : 'Promo'}
                  </h2>
                </div>
                <MediaMasonry items={masonryItems} columns={4} />
              </section>
            )}
          </div>
        </ContentRail>
      </main>
    </div>
  );
}
