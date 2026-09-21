import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { getReleases, getLatestRelease } from '@/lib/content/server';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { ReleaseCard } from '@/components/music/ReleaseCard';
import { StreamingLinks } from '@/components/music/StreamingLinks';
import { DEFAULT_OG_IMAGE } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Music',
  description: 'Releases from DIVINE:TIMING — singles, EPs and DJ mixes.',
  alternates: { canonical: '/music' },
  openGraph: {
    title: 'Music | Divine Timing',
    description: 'Releases from DIVINE:TIMING — singles, EPs and DJ mixes.',
    url: '/music',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Music | Divine Timing',
    description: 'Releases from DIVINE:TIMING — singles, EPs and DJ mixes.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function MusicPage() {
  const [releases, latest] = await Promise.all([getReleases(), getLatestRelease()]);
  const rest = releases.filter((r) => r.id !== latest?.id);
  const latestCover = latest?.resolved_cover_url ?? latest?.cover_image_url ?? null;

  return (
    <div className="flex flex-col w-full">
      {/* Latest release leads the page so music is one interaction away. */}
      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          {latest ? (
            <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="relative aspect-square rounded-[var(--radius-card-lg)] overflow-hidden border border-[var(--border-on-dark)] bg-black/40">
                {latestCover ? (
                  <Image
                    src={latestCover}
                    alt={`${latest.title} cover art`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                    <Disc3 className="w-16 h-16 text-[var(--accent)]/40" />
                  </div>
                )}
              </div>

              <div>
                <p className="section-label mb-3">Now playing</p>
                <h1 className="type-h1 text-[var(--text)]">{latest.title}</h1>
                <p className="type-subtitle text-[var(--text-muted)] mt-3 capitalize">
                  {latest.release_type}
                  {latest.release_date && ` · ${new Date(latest.release_date).getFullYear()}`}
                </p>
                {latest.description && (
                  <p className="type-body text-[var(--text-muted)] mt-5 prose-readability">
                    {latest.description}
                  </p>
                )}
                <StreamingLinks release={latest} className="mt-8" />
                <p className="mt-6">
                  <Link
                    href={`/music/${latest.slug}`}
                    className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
                  >
                    Release details →
                  </Link>
                </p>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <p className="section-label mb-3">Music</p>
              <h1 className="type-h1 text-[var(--text)]">Releases</h1>
              <p className="type-body text-[var(--text-muted)] mt-4">
                New music is on the way.
              </p>
            </Reveal>
          )}
        </Container>
      </section>

      {rest.length > 0 && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <h2 className="type-h2 text-[var(--text)]">Catalogue</h2>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
              {rest.map((release, index) => (
                <Reveal key={release.id} delay={index * 0.04}>
                  <ReleaseCard release={release} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
