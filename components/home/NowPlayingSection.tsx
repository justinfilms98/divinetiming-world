import Image from 'next/image';
import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import type { Release } from '@/lib/types/content';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { StreamingLinks } from '@/components/music/StreamingLinks';

interface NowPlayingSectionProps {
  release: Release | null;
}

/** Brief section 6.2: music must be reachable without hunting for it. */
export function NowPlayingSection({ release }: NowPlayingSectionProps) {
  if (!release) return null;

  const cover = release.resolved_cover_url ?? release.cover_image_url;

  return (
    <section className="band-night relative overflow-hidden">
      <div className="hero-grain" aria-hidden />
      <Container className="relative section-padding">
        <Reveal className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] gap-8 md:gap-12 items-center">
          <Link
            href={`/music/${release.slug}`}
            className="relative aspect-square rounded-[var(--radius-card-lg)] overflow-hidden border border-[var(--border-on-dark)] bg-black/40 focus-ring group"
          >
            {cover ? (
              <Image
                src={cover}
                alt={`${release.title} cover art`}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <Disc3 className="w-14 h-14 text-[var(--accent)]/40" />
              </span>
            )}
          </Link>

          <div>
            <p className="section-label mb-3">Now playing</p>
            <h2 className="type-h2 text-[var(--text)]">{release.title}</h2>
            <p className="type-subtitle text-[var(--text-muted)] mt-3 capitalize">
              {release.release_type}
              {release.release_date && ` · ${new Date(release.release_date).getFullYear()}`}
            </p>
            <StreamingLinks release={release} className="mt-7" />
            <p className="mt-6">
              <Link
                href="/music"
                className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
              >
                All music →
              </Link>
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
