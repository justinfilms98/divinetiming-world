import { getJourneyBlocks, getHeroSection } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { JourneyScroll } from '@/components/journey/JourneyScroll';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Journey',
  description: 'The story of Divine Timing — how we got here, in our own words.',
  alternates: { canonical: '/journey' },
  openGraph: {
    title: 'Our Journey | Divine Timing',
    description: 'The story of Divine Timing — how we got here, in our own words.',
    url: '/journey',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Journey | Divine Timing',
    description: 'The story of Divine Timing — how we got here, in our own words.',
  },
};

export default async function JourneyPage() {
  // Reuse the booking hero media (video/image + overlay) but never inherit the
  // headline / subtext / label — those are fixed to the journey story until a
  // dedicated `journey` hero is added in admin.
  const [blocks, heroSection] = await Promise.all([
    getJourneyBlocks(),
    getHeroSection('booking'),
  ]);

  const headline = 'Our Journey';
  const subtext = 'The story behind the music — in our own words.';
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.55;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge="OUR STORY"
        headline={headline}
        subtext={subtext}
        heightPreset="standard"
        showScrollCue
      />

      <SignatureDivider className="my-16 md:my-24" />

      <main className="flex-1 pb-20 md:pb-28">
        <JourneyScroll blocks={blocks} />
      </main>

      <section className="border-t border-[var(--text)]/10 bg-[var(--bg-secondary)]/40 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="type-label text-[var(--accent)] tracking-[0.25em] mb-3">REACH OUT</p>
          <h2
            className="type-h2 text-[var(--text)] mb-5 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Want to work together?
          </h2>
          <p className="text-[var(--text-muted)] type-body leading-relaxed mb-8">
            For bookings, press, and collaborations — drop us a line.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-[var(--radius-button)] bg-[var(--accent)] text-[var(--text)] type-button font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 glow focus-ring"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
