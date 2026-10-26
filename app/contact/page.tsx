import { getSiteSettings, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Phone } from 'lucide-react';
import { publicPageMetadata } from '@/lib/seo/pageMetadata';

export const dynamic = 'force-dynamic';

export const metadata = publicPageMetadata({
  title: 'Contact',
  description: 'Get in touch with Divine Timing for bookings, press, and collaborations.',
  path: '/contact',
});

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
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge="GET IN TOUCH"
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
      />

      <div className="page-body">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <header className="text-center mb-8 md:mb-12 max-w-2xl mx-auto">
            <p className="section-label mb-3">Reach us</p>
            <h2 className="type-h2 text-[var(--text)] tracking-tight">Three ways to connect</h2>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
            <ContactColumn
              icon={<Phone className="w-7 h-7" aria-hidden />}
              label="Call Us"
              caption="Available during business hours."
              value={bookingPhone}
              href={bookingPhone ? 'tel:' : null}
              fallback="Available by email."
            />
            <ContactColumn
              icon={<Mail className="w-7 h-7" aria-hidden />}
              label="Email Us"
              caption="Best for press, partnerships, and detailed inquiries."
              value={bookingEmail}
              href={bookingEmail ? `mailto:${bookingEmail}` : null}
              fallback="See form below."
            />
            <ContactColumn
              icon={
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
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
            className="scroll-mt-[calc(var(--public-nav-height)+1rem)] max-w-3xl mx-auto bg-[var(--bg-secondary)]/40 border border-[var(--accent)]/10 rounded-2xl p-6 sm:p-10 md:p-12"
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
      </div>
    </div>
  );
}

function formatTelHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? `tel:${digits}` : `tel:${digits.replace(/^\+?/, '+')}`;
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
  const resolvedHref =
    href && value
      ? href.startsWith('tel:')
        ? formatTelHref(value)
        : href
      : null;
  const isInteractive = Boolean(resolvedHref);

  // Phones: compact row (icon left). sm+: centred column card.
  const inner = (
    <>
      <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center sm:mb-4 [&_svg]:w-6 [&_svg]:h-6 md:[&_svg]:w-7 md:[&_svg]:h-7">
        {icon}
      </div>
      <div className="min-w-0 flex flex-col sm:items-center">
        <p className="type-label text-[var(--text-muted)] tracking-[0.2em] mb-1 sm:mb-2">{label.toUpperCase()}</p>
        <p className="hidden sm:block text-[var(--text-muted)] text-sm mb-3 max-w-[28ch] leading-relaxed">{caption}</p>
        <p
          className={
            isInteractive
              ? 'text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-200 type-body font-medium break-words'
              : 'text-[var(--text-muted)]/70 text-sm'
          }
        >
          {display}
        </p>
      </div>
    </>
  );

  const cardClass =
    'group flex flex-row items-center gap-4 text-left sm:flex-col sm:gap-0 sm:text-center px-4 py-4 sm:py-6 rounded-2xl w-full min-h-[44px] border border-[var(--text)]/10 sm:border-transparent transition-colors duration-200';

  if (isInteractive && resolvedHref) {
    return (
      <a
        href={resolvedHref}
        className={`${cardClass} hover:bg-[var(--accent)]/5 focus-ring cursor-pointer`}
      >
        {inner}
      </a>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
