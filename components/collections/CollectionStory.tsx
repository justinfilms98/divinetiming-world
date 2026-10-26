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
  /** Intrinsic pixel size when recorded at upload; lets the frame reserve its true shape. */
  width?: number | null;
  height?: number | null;
}

interface CollectionStoryProps {
  title: string;
  intro?: string | null;
  theme?: string | null;
  coverUrl?: string | null;
  frames: StoryFrame[];
}

/** Full-gallery sizing: a frame never exceeds the column width or ~88% of the screen height. */
const FRAME_MAX_HEIGHT = '88svh';
const FRAME_SIZES = '(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1100px';

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
    <div className="band-night relative overflow-hidden">
      <div className="hero-grain" aria-hidden />

      <Container className="relative pt-10 md:pt-16 pb-10 md:pb-14">
        <Reveal>
          <Link
            href="/collections"
            className="inline-flex min-h-[44px] items-center type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
          >
            ← All stories
          </Link>
          {theme && <p className="section-label mt-6 mb-3">{theme}</p>}
          <h1 className={cn('type-h1 text-[var(--text-on-dark)] tracking-tight', !theme && 'mt-6')}>{title}</h1>
          {intro && (
            <p className="type-body text-[var(--text-on-dark-muted)] mt-4 prose-readability max-w-[46ch]">{intro}</p>
          )}
        </Reveal>

        {coverUrl && (
          <Reveal className="mt-8 md:mt-12">
            {/* Cover is an intentional crop (banner); gallery frames below are never cropped. */}
            <div className="relative aspect-[4/5] max-h-[72svh] sm:aspect-[3/2] md:aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--border-on-dark)] bg-black/40">
              <Image
                src={coverUrl}
                alt=""
                fill
                priority
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover"
                style={{ objectPosition: '50% 42%' }}
              />
            </div>
          </Reveal>
        )}
      </Container>

      <Container className="relative pb-16 md:pb-24">
        <ol className="flex flex-col gap-14 md:gap-24 max-w-[1100px] mx-auto">
          {frames.map((frame, index) => (
            <li key={frame.id}>
              <Reveal>
                <StoryFrameFigure
                  frame={frame}
                  number={String(index + 1).padStart(2, '0')}
                  title={title}
                  onOpen={() => openFrame(frame.id)}
                />
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>

      <Lightbox
        items={lightboxItems}
        startIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}

function StoryFrameFigure({
  frame,
  number,
  title,
  onOpen,
}: {
  frame: StoryFrame;
  number: string;
  title: string;
  onOpen: () => void;
}) {
  const caption = frame.caption?.trim() || null;
  const hasSize = Boolean(frame.width && frame.height);
  // Without recorded dimensions the image has no height until it loads; hold space so
  // frames below don't all count as "in view" and the page doesn't jump as much.
  const [loaded, setLoaded] = useState(hasSize);

  return (
    // w-fit: the figure shrink-wraps the photo so number and caption align to its edges.
    <figure className="w-fit max-w-full mx-auto">
      <span className="block type-label text-[var(--accent)] tracking-[0.2em] mb-3" aria-hidden>
        {number}
      </span>

      {frame.media_type === 'video' ? (
        <video
          src={frame.url}
          poster={frame.thumbnail_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="block w-full max-w-full rounded-[var(--radius-card-lg)] border border-[var(--accent)]/20 bg-black"
          style={{ maxHeight: FRAME_MAX_HEIGHT }}
        />
      ) : (
        <button
          type="button"
          onClick={onOpen}
          aria-label={caption ? `Open photo ${number}: ${caption}` : `Open photo ${number} of ${title}`}
          className={cn(
            'flex justify-center max-w-full rounded-[var(--radius-card-lg)] focus-ring cursor-zoom-in',
            !loaded && 'min-h-[50svh] w-[min(100%,700px)] bg-white/[0.03]'
          )}
        >
          <Image
            src={frame.url}
            alt={caption || ''}
            width={frame.width ?? 0}
            height={frame.height ?? 0}
            loading="lazy"
            sizes={FRAME_SIZES}
            quality={82}
            onLoad={() => setLoaded(true)}
            className="block rounded-[var(--radius-card-lg)] border border-[var(--accent)]/20"
            // Intrinsic proportions: portrait stays portrait, landscape stays landscape.
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: FRAME_MAX_HEIGHT }}
          />
        </button>
      )}

      {caption && (
        <figcaption className="type-body text-[var(--text-on-dark-muted)] mt-4 max-w-[60ch]">{caption}</figcaption>
      )}
    </figure>
  );
}
