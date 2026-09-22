'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/motion/Reveal';
import { Container } from '@/components/ui/Container';
import { Lightbox, type LightboxItem } from '@/components/media/Lightbox';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { cn } from '@/lib/ui/cn';

export interface StoryFrame {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
}

interface CollectionStoryProps {
  title: string;
  intro?: string | null;
  theme?: string | null;
  coverUrl?: string | null;
  frames: StoryFrame[];
}

export function CollectionStory({ title, intro, theme, coverUrl, frames }: CollectionStoryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const imageFrames = frames.filter((frame) => frame.media_type === 'image');
  const lightboxItems: LightboxItem[] = imageFrames.map((frame) => ({
    url: frame.url,
    mediaType: 'image',
    caption: frame.caption,
    alt: frame.caption || title,
  }));

  const openFrame = (frameId: string) => {
    const index = imageFrames.findIndex((frame) => frame.id === frameId);
    if (index >= 0) setLightboxIndex(index);
  };

  return (
    <>
      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal>
            <Link
              href="/collections"
              className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
            >
              ← All stories
            </Link>
            {theme && <p className="section-label mt-10 mb-3">{theme}</p>}
            <h1 className={cn('type-h1 text-[var(--text)] tracking-tight', !theme && 'mt-10')}>
              {title}
            </h1>
            {intro && (
              <p className="type-body text-[var(--text-muted)] mt-6 prose-readability max-w-[42ch]">
                {intro}
              </p>
            )}
          </Reveal>

          {coverUrl && (
            <Reveal className="mt-12">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--border-on-dark)] bg-black/40">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {frames.map((frame, index) => {
        const night = index % 2 === 1;
        const number = String(index + 1).padStart(2, '0');
        const caption = frame.caption?.trim() || null;

        return (
          <section
            key={frame.id}
            className={cn(night ? 'band-night relative overflow-hidden' : 'band-sand')}
          >
            {night && <div className="hero-grain" aria-hidden />}
            <Container className="relative section-padding">
              <Reveal>
                <article className="grid grid-cols-1 md:grid-cols-[4.5rem_minmax(0,1fr)] gap-5 md:gap-10">
                  <div className="flex md:flex-col items-center gap-3 md:gap-0" aria-hidden>
                    <span className="type-label text-[var(--accent)] tracking-[0.2em]">{number}</span>
                    <div className="hidden md:block w-px flex-1 min-h-[5rem] mt-4 bg-[var(--accent)]/25" />
                  </div>

                  <div className="min-w-0">
                    {frame.media_type === 'video' ? (
                      <video
                        src={frame.url}
                        poster={frame.thumbnail_url ?? undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full rounded-[var(--radius-card-lg)] border border-[var(--accent)]/20 bg-black"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFrame(frame.id)}
                        className="relative block w-full aspect-[16/10] overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--accent)]/20 bg-[var(--bg-secondary)] focus-ring"
                      >
                        <Image
                          src={frame.url}
                          alt={caption || ''}
                          fill
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          sizes="(max-width: 768px) 100vw, 80vw"
                          className="object-cover"
                        />
                      </button>
                    )}
                    {caption && (
                      <p className="type-body text-[var(--text-muted)] mt-5 prose-readability max-w-[50ch]">
                        {caption}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            </Container>
          </section>
        );
      })}

      <Lightbox
        items={lightboxItems}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}
