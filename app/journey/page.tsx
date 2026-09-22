import { getJourneyBlocks, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { JourneyScroll } from '@/components/journey/JourneyScroll';
import { SectionCta } from '@/components/home/SectionCta';
import { Reveal } from '@/components/motion/Reveal';
import { Container } from '@/components/ui/Container';
import { aboutPageJsonLd } from '@/lib/seo/jsonld';
import { BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PAGE_TITLE = 'Our Journey';
const PAGE_DESCRIPTION =
  'The story of DIVINE:TIMING — told in chapters, in our own words.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/journey' },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: '/journey',
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

export default async function JourneyPage() {
  const [blocks, journeyHero, bookingHero] = await Promise.all([
    getJourneyBlocks(),
    getHeroSection('journey'),
    getHeroSection('booking'),
  ]);

  const heroSection = journeyHero ?? bookingHero;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.55;

  const jsonLd = aboutPageJsonLd({
    name: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/journey`,
    chapters: blocks
      .map((block) => ({
        name: block.title?.trim() || block.era_label?.trim() || '',
        description: block.body?.trim() || undefined,
      }))
      .filter((chapter) => chapter.name.length > 0),
  });

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge="OUR STORY"
        headline={PAGE_TITLE}
        subtext="The story behind the music — in our own words."
        heightPreset="standard"
        showScrollCue
      />

      <JourneyScroll blocks={blocks} />

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
