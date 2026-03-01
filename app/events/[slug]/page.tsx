import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEventBySlug, getHeroSection } from '@/lib/content';
import { UnifiedHero } from '@/components/hero/UnifiedHero';

export const dynamic = 'force-dynamic';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const [event, eventsHero] = await Promise.all([
    getEventBySlug(params.slug),
    getHeroSection('events'),
  ]);

  if (!event) {
    notFound();
  }

  const location = [event.venue, event.city].filter(Boolean).join(' · ');
  const title = event.title ?? event.city;
  const heroMediaUrl = event.thumbnail_url ?? eventsHero?.mediaFinalUrl ?? undefined;
  const heroMediaType = event.thumbnail_url ? 'image' : (eventsHero?.media_type ?? undefined);

  return (
    <div className="min-h-screen flex flex-col">
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

          <article className="flex flex-col md:flex-row gap-8">
            {event.thumbnail_url && (
              <div className="md:w-80 flex-shrink-0">
                <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden bg-white/5">
                  <Image
                    src={event.thumbnail_url}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="text-[var(--accent)] text-sm font-semibold tracking-wider uppercase">
                {formatDate(event.date)}
                {event.time && ` · ${event.time}`}
              </div>
              <h1 className="text-4xl font-bold text-white mt-2">{title}</h1>
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
                  className="inline-block mt-8 px-8 py-4 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent2)] transition-colors font-semibold glow"
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
