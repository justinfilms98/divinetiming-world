import { getSiteSettings, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Phone } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Divine Timing for bookings, press, and collaborations.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact | Divine Timing',
    description: 'Get in touch with Divine Timing for bookings, press, and collaborations.',
    url: '/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Divine Timing',
    description: 'Get in touch with Divine Timing for bookings, press, and collaborations.',
  },
};

export default async function ContactPage() {
  // Inherit the booking hero's media only (overlayed video/image). Headline and
  // subtext are fixed to the contact context.
  const [siteSettings, heroSection] = await Promise.all([
    getSiteSettings(),
    getHeroSection('booking'),
  ]);

  const headline = 'Contact';
  const subtext = 'For bookings, press, collaborations — or just to say hello.';
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.55;

  const bookingEmail = siteSettings?.booking_email?.trim() ?? '';
  const bookingPhone = siteSettings?.booking_phone?.trim() ?? '';

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge="GET IN TOUCH"
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
      />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header block */}
          <header className="text-center mb-14 md:mb-20 max-w-2xl mx-auto">
            <p className="type-label text-[var(--accent)] tracking-[0.25em] mb-3">REACH US</p>
            <h2
              className="type-h2 text-[var(--text)] mb-4 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three ways to connect
            </h2>
            <p className="type-body text-[var(--text-muted)] leading-relaxed">
              Bookings, press, collaborations, or just to say hello — pick the channel that works for you.
            </p>
          </header>

          {/* 3-column Dior-style grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-20 md:mb-24">
            <ContactColumn
              icon={<Phone className="w-6 h-6" />}
              label="Call Us"
              caption="Available during business hours."
              value={bookingPhone}
              href={bookingPhone ? `tel:${bookingPhone}` : null}
              fallback="Available by email."
            />
            <ContactColumn
              icon={<Mail className="w-6 h-6" />}
              label="Email Us"
              caption="Best for press, partnerships, and detailed inquiries."
              value={bookingEmail}
              href={bookingEmail ? `mailto:${bookingEmail}` : null}
              fallback="See form below."
            />
            <ContactColumn
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              }
              label="Inquiry Form"
              caption="Send all details in one go."
              value="Use the form below"
              href="#contact-form"
              fallback="Use the form below"
            />
          </div>

          {/* Inquiry form */}
          <section
            id="contact-form"
            className="scroll-mt-24 max-w-3xl mx-auto bg-[var(--bg-secondary)]/40 border border-[var(--accent)]/10 rounded-2xl p-6 sm:p-10 md:p-12"
          >
            <header className="text-center mb-10">
              <h3
                className="type-h2 text-[var(--text)] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Send a message
              </h3>
              <p className="type-body text-[var(--text-muted)] mt-2 max-w-[45ch] mx-auto">
                Fill in what you can. We&apos;ll reply within 1–3 business days.
              </p>
            </header>
            <ContactForm />
          </section>
        </div>
      </main>
    </div>
  );
}

function ContactColumn({
  icon,
  label,
  caption,
  value,
  href,
  fallback,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
  value: string;
  href: string | null;
  fallback: string;
}) {
  const display = value || fallback;
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-5">
        {icon}
      </div>
      <p className="type-label text-[var(--text-muted)] tracking-[0.2em] mb-2">{label.toUpperCase()}</p>
      <p className="text-[var(--text-muted)] text-sm mb-4 max-w-[28ch] leading-relaxed">{caption}</p>
      {href && value ? (
        <a
          href={href}
          className="text-[var(--text)] hover:text-[var(--accent)] transition-colors duration-200 type-body font-medium"
        >
          {display}
        </a>
      ) : (
        <p className="text-[var(--text-muted)]/70 text-sm">{display}</p>
      )}
    </div>
  );
}
