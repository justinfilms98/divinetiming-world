import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEventBySlug, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
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
  return {
    title,
    description: location ? `${title} — ${location}` : undefined,
    openGraph: { title: `${title} | Divine Timing`, description: location || undefined },
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaUrl={heroMediaUrl}
        mediaType={heroMediaType}
        overlayOpacity={Number(eventsHero?.overlay_opacity ?? 0.5)}
        headline={title}
        subtext={location}
        heightPreset="standard"
      />
      <Header />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors mb-8"
          >
            ← Back to Events
          </Link>

          <article className="flex flex-col md:flex-row gap-8 min-w-0">
            {imageUrl && (
              <div className="md:w-80 flex-shrink-0 min-w-0">
                <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden bg-white/5">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="type-label text-[var(--accent)]">
                {formatDate(event.date)}
                {event.time && ` · ${event.time}`}
              </div>
              <h1 className="type-h1 text-white mt-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
              {location && (
                <p className="text-white/80 text-lg mt-2">{location}</p>
              )}
              {event.description && (
                <div className="mt-6 text-white/70 leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              )}
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-[48px] mt-8 px-8 py-4 rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] font-semibold type-button hover:bg-[var(--accent-hover)] transition-colors glow focus-ring"
                >
                  Get Tickets
                </a>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
