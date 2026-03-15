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
      {/* Hero: compact, supports page without dominating */}
      <div className="pt-[4.5rem] md:pt-24">
        <UnifiedHero
          mediaType={mediaType ?? undefined}
          mediaUrl={mediaUrl ?? undefined}
          overlayOpacity={Number(overlayOpacity)}
          badge={heroSection?.label_text?.trim() || undefined}
          headline={headline}
          subtext={subtext}
          heightPreset="compact"
        >
          <HeroContent ctaText={ctaText} ctaUrl={ctaUrl} />
        </UnifiedHero>
      </div>

      <SignatureDivider className="my-14 md:my-16" />

      {bookingSections && bookingSections.length > 0 && (
        <>
          <BookingStoryScroll sections={bookingSections} />
          <SignatureDivider className="my-14 md:my-16" />
        </>
      )}

      {/* Inquiry: full-bleed band — premium destination feel */}
      <section
        id="booking-form"
        className="scroll-mt-24 md:scroll-mt-28 bg-[var(--bg-secondary)]/30 border-y border-[var(--text)]/[0.06] mt-2 md:mt-4"
        aria-label="Booking form and contact"
      >
        <Container className="min-w-0 py-16 md:py-24">
          <header className="text-center mb-14 md:mb-16">
            <h2 className="type-h2 font-semibold tracking-tight text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Booking inquiries
            </h2>
            <p className="mt-5 text-[var(--text-muted)] type-body max-w-[40ch] mx-auto leading-relaxed">
              Send your details and we&apos;ll get back to you.
            </p>
          </header>

          <div className="max-w-[1000px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_320px] gap-14 lg:gap-16 items-start">
              <div className="min-w-0">
                <Card className="p-6 sm:p-8 md:p-10 shadow-[var(--shadow-card)] border border-[var(--accent)]/10 bg-[var(--bg)] rounded-2xl">
                  <BookingForm />
                </Card>
              </div>

              <aside className="flex flex-col gap-6 min-w-0 lg:min-w-[280px]" aria-label="Contact and resources">
                <Card className="p-6 border border-[var(--accent)]/[0.08] bg-[var(--bg)]/80 rounded-xl">
                  <h3 className="type-h3 text-[var(--text)] mb-3.5 font-medium" style={{ fontFamily: 'var(--font-display)' }}>
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

                <Card className="p-6 border border-[var(--accent)]/[0.08] bg-[var(--bg)]/80 rounded-xl">
                  <h3 className="type-h3 text-[var(--text)] mb-3.5 font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                    Press / EPK
                  </h3>
                  <p className="type-body text-[var(--text-muted)] mb-4 text-sm leading-relaxed">
                    Electronic press kit for promoters and press.
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
                  <Card className="p-6 border border-[var(--accent)]/[0.08] bg-[var(--bg)]/80 rounded-xl">
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
      </section>
    </div>
  );
}
