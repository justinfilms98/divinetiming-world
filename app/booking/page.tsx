import {
  getSiteSettings,
  getBookingContent,
  getHeroSection,
  getPageSettings,
  getAboutContent,
} from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { HeroContent } from '@/components/home/HeroContent';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { BookingStoryScroll } from '@/components/booking/BookingStoryScroll';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingAboutCard } from '@/components/booking/BookingAboutCard';
import { BookingBioSection } from '@/components/booking/BookingBioSection';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Booking',
  description: 'Book Divine Timing for your event. Get in touch for festivals, club nights, and collaborations.',
  alternates: { canonical: '/booking' },
  openGraph: {
    title: 'Booking | Divine Timing',
    description: 'Book Divine Timing for your event. Get in touch for festivals, club nights, and collaborations.',
    url: '/booking',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Booking | Divine Timing',
    description: 'Book Divine Timing for your event. Get in touch for festivals, club nights, and collaborations.',
  },
};

export default async function BookingPage() {
  const [siteSettings, bookingSections, heroSection, pageSettings, aboutContent] = await Promise.all([
    getSiteSettings(),
    getBookingContent(),
    getHeroSection('booking'),
    getPageSettings('booking'),
    getAboutContent(),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Booking';
  const subtext = heroSection?.subtext ?? "Let's create something together.";
  const ctaText = heroSection?.cta_text ?? 'Get in touch';
  const ctaUrl = heroSection?.cta_url ?? '#booking-form';
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  const bookingEmail = siteSettings?.booking_email ?? '';
  const bookingPhone = siteSettings?.booking_phone ?? '';
  const sponsorsRaw = pageSettings?.booking_sponsors ?? '';
  const sponsors = sponsorsRaw ? sponsorsRaw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      {/* Refined booking hero */}
      <div className="pt-20 md:pt-24">
        <UnifiedHero
          mediaType={mediaType ?? undefined}
          mediaUrl={mediaUrl ?? undefined}
          overlayOpacity={Number(overlayOpacity)}
          badge={heroSection?.label_text?.trim() || undefined}
          headline={headline}
          subtext={subtext}
          heightPreset="standard"
        >
          <HeroContent ctaText={ctaText} ctaUrl={ctaUrl} />
        </UnifiedHero>
      </div>

      <SignatureDivider />

      {bookingSections && bookingSections.length > 0 && (
        <>
          <BookingStoryScroll sections={bookingSections} />
          <SignatureDivider className="mb-8 md:mb-10" />
        </>
      )}

      {/* Inquiry section: centered two-column block, heading inside container for alignment */}
      <Section
        id="booking-form"
        className="scroll-mt-24 md:scroll-mt-28 min-w-0 overflow-x-clip pt-10 md:pt-12 pb-12 md:pb-16"
        aria-label="Booking form and contact"
      >
        <Container className="min-w-0">
          <header className="mb-8 md:mb-10">
            <h2 className="type-h2 font-semibold tracking-tight text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Booking inquiries
            </h2>
            <p className="mt-2 text-[var(--text-muted)] type-body prose-readability">
              Send your details and we&apos;ll get back to you.
            </p>
          </header>

          {/* Centered two-column block: form substantial, aside supporting rail */}
          <div className="max-w-[1000px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 lg:gap-12">
              {/* Form column */}
              <div className="min-w-0">
                <Card className="p-6 sm:p-8 shadow-lg border border-[var(--accent)]/10">
                  <BookingForm />
                </Card>
              </div>

              {/* Aside: unified supporting rail */}
              <aside
                className="flex flex-col gap-6 min-w-0 lg:min-w-[280px]"
                aria-label="Contact and resources"
              >
                <Card className="p-6 border border-[var(--accent)]/10 w-full">
                  <h3 className="type-h3 text-[var(--text)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Contact & management
                  </h3>
                  <div className="space-y-2 type-body text-[var(--text-muted)]">
                    {bookingEmail && (
                      <p>
                        <a href={`mailto:${bookingEmail}`} className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                          {bookingEmail}
                        </a>
                      </p>
                    )}
                    {bookingPhone && (
                      <p>
                        <a href={`tel:${bookingPhone}`} className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                          {bookingPhone}
                        </a>
                      </p>
                    )}
                    {!bookingEmail && !bookingPhone && (
                      <p className="text-sm">Contact details can be set in admin settings.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border border-[var(--accent)]/10 w-full">
                  <h3 className="type-h3 text-[var(--text)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Press / EPK download
                  </h3>
                  <p className="type-body text-[var(--text-muted)] mb-4 text-sm leading-relaxed">
                    Download our electronic press kit for promoters and press.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/epk"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 hover:bg-[var(--accent)]/25 transition-colors duration-200 type-button text-sm font-medium"
                    >
                      View EPK
                    </Link>
                    <Link
                      href="/media"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] border border-[var(--accent)]/15 text-[var(--text-muted)] hover:bg-white/5 transition-colors duration-200 type-button text-sm"
                    >
                      Press photos
                    </Link>
                  </div>
                </Card>

                <BookingBioSection
                  bioHtml={aboutContent?.bio_html ?? null}
                  bioText={aboutContent?.bio_text ?? ''}
                  title="Artist bio"
                />

                <BookingAboutCard
                  title={pageSettings?.booking_about_title}
                  body={pageSettings?.booking_about_body}
                  imageUrl={pageSettings?.booking_about_image_url}
                />

                {sponsors.length > 0 && (
                  <Card className="p-6 border border-[var(--accent)]/10 w-full">
                    <h3 className="type-h3 text-[var(--text-muted)] mb-2 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-ui)' }}>
                      Partners & affiliations
                    </h3>
                    <p className="type-body text-[var(--text-muted)] text-sm whitespace-pre-line leading-relaxed">{sponsors.join('\n')}</p>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
