import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEventBySlug, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { EventDetailCard } from '@/components/events/EventDetailCard';
import { Container } from '@/components/ui/Container';
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

  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;
  const imageUrl = event.resolved_thumbnail_url ?? event.thumbnail_url ?? null;
  const heroMediaUrl = imageUrl ?? eventsHero?.mediaFinalUrl ?? undefined;
  const heroMediaType = imageUrl ? 'image' : (eventsHero?.media_type ?? undefined);

  const sharePath = `/events/${event.slug || event.id}`;

  const descriptionParagraphs = event.description
    ? event.description.split(/\n\n+/).filter(Boolean)
    : [];

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
      <div className="max-w-[1200px] mx-auto w-full px-5 md:px-8">
        <div className="w-full max-h-[420px] overflow-hidden rounded-b-2xl">
        <UnifiedHero
          mediaUrl={heroMediaUrl}
          mediaType={heroMediaType}
          overlayOpacity={Number(eventsHero?.overlay_opacity ?? 0.5)}
          badge={eventsHero?.label_text?.trim() || undefined}
          headline={title}
          subtext={location}
          heightPreset="standard"
        />
        </div>
      </div>
      <main className="flex-1 pt-24 md:pt-28 pb-20 min-w-0">
        <Container>
          <div className="max-w-[1000px] mx-auto w-full">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded nav-link-underline"
          >
            ← Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-14 lg:gap-20 items-start">
            <article className="min-w-0 space-y-10">
              {imageUrl ? (
                <div className="w-full max-w-[65ch]">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--accent)]/10 shadow-[var(--shadow-card)]">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 65ch"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[65ch]">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--accent)]/10 flex items-center justify-center" aria-hidden>
                    <span className="text-[var(--text-muted)]/40 text-3xl font-light tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="max-w-[65ch] leading-relaxed space-y-6 text-[var(--text)] type-body" style={{ fontFamily: 'var(--font-body)' }}>
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
          </div>
        </Container>
      </main>
    </div>
  );
}
