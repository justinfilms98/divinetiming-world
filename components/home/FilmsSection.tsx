import Link from 'next/link';
import Image from 'next/image';
import type { MediaPageVideo } from '@/lib/content/shared';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from './SectionHeading';
import { SectionCta } from './SectionCta';

interface FilmsSectionProps {
  videos: MediaPageVideo[];
}

/**
 * Films are shown as poster tiles linking to /media rather than embedded
 * players: the homepage should not pull YouTube iframes on first paint.
 */
export function FilmsSection({ videos }: FilmsSectionProps) {
  if (videos.length === 0) return null;

  return (
    <section className="band-night relative overflow-hidden">
      <div className="hero-grain" aria-hidden />
      <Container className="relative section-padding">
        <Reveal>
          <SectionHeading label="Films" title="Watch" />
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {videos.map((video, index) => (
            <Reveal key={video.id} delay={index * 0.05}>
              <Link
                href="/media"
                className="group block rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-subtle)] focus-ring"
              >
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  {video.resolved_thumbnail_url && (
                    <Image
                      src={video.resolved_thumbnail_url}
                      alt={video.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                    aria-hidden
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-sm transition-colors duration-200 group-hover:border-[var(--accent)] group-hover:bg-black/60">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 translate-x-[1px] fill-white"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="type-h3 text-[var(--text)] line-clamp-1">{video.title}</h3>
                  {video.caption && (
                    <p className="type-small mt-1.5 line-clamp-1">{video.caption}</p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <SectionCta href="/media" variant="secondary">
            All media
          </SectionCta>
        </Reveal>
      </Container>
    </section>
  );
}
