import type { Metadata } from 'next';
import { getPerformanceProof, getSiteSettings } from '@/lib/content/server';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionCta } from '@/components/home/SectionCta';
import { BookingInquiryForm } from '@/components/booking/BookingInquiryForm';
import { DEFAULT_OG_IMAGE } from '@/lib/site';

export const dynamic = 'force-dynamic';

const DESCRIPTION =
  'A live electronic performance combining DJ sets, percussion, vocals and immersive crowd energy. Book DIVINE:TIMING for festivals, clubs and private events worldwide.';

export const metadata: Metadata = {
  title: 'Book DIVINE:TIMING',
  description: DESCRIPTION,
  alternates: { canonical: '/booking' },
  openGraph: {
    title: 'Book DIVINE:TIMING',
    description: DESCRIPTION,
    url: '/booking',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book DIVINE:TIMING',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function BookingPage() {
  const [proof, settings] = await Promise.all([getPerformanceProof(), getSiteSettings()]);
  const hasProof = proof.showCount > 0 || proof.cities.length > 0;

  return (
    <div className="flex flex-col w-full">
      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal className="max-w-2xl">
            <p className="section-label mb-3">Booking</p>
            <h1 className="type-h1 text-[var(--text)]">Book DIVINE:TIMING</h1>
            <p className="type-subtitle text-[var(--text-muted)] mt-5">
              A live electronic performance combining DJ sets, percussion, vocals and immersive
              crowd energy.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <SectionCta href="#inquiry">Start booking inquiry</SectionCta>
              <SectionCta href="/presskit" variant="secondary">
                Download press kit
              </SectionCta>
            </div>
            {settings?.booking_email && (
              <p className="type-caption mt-6">
                Direct:{' '}
                <a
                  href={`mailto:${settings.booking_email}`}
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
                >
                  {settings.booking_email}
                </a>
              </p>
            )}
          </Reveal>
        </Container>
      </section>

      {/* Only rendered once real events exist; never shows invented numbers. */}
      {hasProof && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <h2 className="type-h2 text-[var(--text)]">Where we&apos;ve played</h2>
            </Reveal>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
              {proof.showCount > 0 && (
                <Reveal>
                  <dt className="section-label">Shows performed</dt>
                  <dd className="type-h1 text-[var(--accent)] mt-2">{proof.showCount}</dd>
                </Reveal>
              )}
              {proof.cities.length > 0 && (
                <Reveal delay={0.05}>
                  <dt className="section-label">Cities</dt>
                  <dd className="type-h1 text-[var(--accent)] mt-2">{proof.cities.length}</dd>
                </Reveal>
              )}
              {proof.venues.length > 0 && (
                <Reveal delay={0.1}>
                  <dt className="section-label">Venues</dt>
                  <dd className="type-h1 text-[var(--accent)] mt-2">{proof.venues.length}</dd>
                </Reveal>
              )}
            </dl>

            {proof.cities.length > 0 && (
              <Reveal className="mt-10">
                <p className="section-label mb-3">Selected cities</p>
                <p className="type-body text-[var(--text-muted)] prose-readability">
                  {proof.cities.join(' · ')}
                </p>
              </Reveal>
            )}
          </Container>
        </section>
      )}

      <section id="inquiry" className="band-dune scroll-mt-24">
        <Container className="section-padding">
          <Reveal className="max-w-3xl mx-auto">
            <h2 className="type-h2 text-[var(--text)]">Start a booking inquiry</h2>
            <p className="type-body text-[var(--text-muted)] mt-3">
              The more detail you share, the faster we can confirm availability.
            </p>
            <div className="mt-10">
              <BookingInquiryForm />
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
