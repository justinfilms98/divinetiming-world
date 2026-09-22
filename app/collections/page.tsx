import { getGalleriesForHub, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { CollectionsHub } from '@/components/collections/CollectionsHub';
import { SectionCta } from '@/components/home/SectionCta';
import { Reveal } from '@/components/motion/Reveal';
import { Container } from '@/components/ui/Container';
import { collectionPageJsonLd } from '@/lib/seo/jsonld';
import { absoluteImageUrl, BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';
import { collectionStoryHref } from '@/lib/content/shared';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PAGE_TITLE = 'Collections';
const PAGE_DESCRIPTION =
  'Visual stories from DIVINE:TIMING — photographs sequenced, not dumped.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/collections' },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: '/collections',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function CollectionsPage() {
  const [stories, heroSection] = await Promise.all([
    getGalleriesForHub(),
    getHeroSection('media'),
  ]);

  const lead = stories.find((story) => story.is_featured && story.resolved_cover_url) ?? stories[0];
  const heroMedia = lead?.resolved_cover_url ?? heroSection?.mediaFinalUrl ?? null;

  const jsonLd = collectionPageJsonLd({
    name: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/collections`,
    stories: stories.map((story) => ({
      name: story.name,
      url: `${BASE_URL}${collectionStoryHref(story.slug)}`,
      description: story.description?.trim() || undefined,
      image: absoluteImageUrl(story.resolved_cover_url) ?? undefined,
    })),
  });

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UnifiedHero
        mediaType={heroMedia ? 'image' : (heroSection?.media_type ?? undefined)}
        mediaUrl={heroMedia ?? undefined}
        overlayOpacity={Number(heroSection?.overlay_opacity ?? 0.55)}
        badge="Collections"
        headline="Visual stories"
        subtext="Photographs, sequenced — in our own frames."
        heightPreset="standard"
        showScrollCue
      />

      <main>
        <CollectionsHub stories={stories} />
      </main>

      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal className="max-w-2xl mx-auto text-center">
            <p className="section-label mb-3">Reach out</p>
            <h2 className="type-h2 text-[var(--text)]">Want to work together?</h2>
            <p className="type-body text-[var(--text-muted)] mt-5 prose-readability mx-auto">
              For bookings, press, and collaborations — drop us a line.
            </p>
            <div className="mt-8 flex justify-center">
              <SectionCta href="/contact">Contact us</SectionCta>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
