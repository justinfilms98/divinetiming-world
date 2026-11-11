import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { JournalCard } from '@/components/journal/JournalCard';
import { isJournalPublic } from '@/lib/journal/settings';
import { getPublicJournalEpisodes } from '@/lib/journal/server';
import { displayImageUrl } from '@/lib/media/webCopies';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

const DESCRIPTION = 'Episodes, travel stories and the road between the shows.';

export const metadata: Metadata = {
  title: 'Journal',
  description: DESCRIPTION,
  alternates: { canonical: '/journal' },
  openGraph: {
    title: `Journal | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: '/journal',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} Journal` }],
  },
  twitter: { card: 'summary_large_image', title: `Journal | ${SITE_NAME}`, description: DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

export default async function JournalPage() {
  if (!(await isJournalPublic())) notFound();
  const episodes = (await getPublicJournalEpisodes()).map((e) => ({ ...e, cover_image_url: displayImageUrl(e.cover_image_url) }));
  const upcoming = episodes.filter((e) => e.status === 'coming_soon');
  const published = episodes.filter((e) => e.status === 'published');

  return (
    <div className="flex flex-col w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([{ name: SITE_NAME, url: BASE_URL }, { name: 'Journal', url: `${BASE_URL}/journal` }])),
        }}
      />
      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal>
            <p className="section-label mb-3">Journal</p>
            <h1 className="type-h1 text-[var(--text)]">Episodes from the road</h1>
            <p className="type-body text-[var(--text-muted)] mt-4 max-w-[52ch]">{DESCRIPTION}</p>
          </Reveal>

          {upcoming.length > 0 && (
            <div className="mt-12">
              <h2 className="section-label mb-4">Next episode</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {upcoming.map((episode, i) => (
                  <JournalCard key={episode.id} episode={episode} eager={i === 0} />
                ))}
              </div>
            </div>
          )}

          {published.length > 0 ? (
            <div className="mt-12">
              {upcoming.length > 0 && <h2 className="section-label mb-4">Episodes</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {published.map((episode, i) => (
                  <JournalCard key={episode.id} episode={episode} eager={upcoming.length === 0 && i === 0} />
                ))}
              </div>
            </div>
          ) : (
            upcoming.length === 0 && <p className="type-body text-[var(--text-muted)] mt-12">The first episodes are on their way.</p>
          )}
        </Container>
      </section>
    </div>
  );
}
