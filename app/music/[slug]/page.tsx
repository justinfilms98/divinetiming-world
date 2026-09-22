import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { getReleaseBySlug } from '@/lib/content/server';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { StreamingLinks } from '@/components/music/StreamingLinks';
import { breadcrumbJsonLd, releaseJsonLd } from '@/lib/seo/jsonld';
import { absoluteImageUrl, BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> | { slug: string } };

/** Accepts watch, youtu.be and embed forms; returns null for anything else. */
function youtubeEmbedId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: 'Release' };

  const path = `/music/${release.slug}`;
  const description =
    release.description?.slice(0, 160) ??
    `${release.title} — ${release.release_type} by ${SITE_NAME}.`;
  const ogImage = absoluteImageUrl(release.resolved_cover_url ?? release.cover_image_url) ?? DEFAULT_OG_IMAGE;

  return {
    title: release.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${release.title} | ${SITE_NAME}`,
      description,
      url: path,
      type: 'music.song',
      images: [{ url: ogImage, width: 1200, height: 630, alt: release.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${release.title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ReleaseDetailPage({ params }: Params) {
  const { slug } = await Promise.resolve(params);
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const cover = release.resolved_cover_url ?? release.cover_image_url ?? null;
  const absoluteCover = absoluteImageUrl(cover) ?? null;
  const embedId = youtubeEmbedId(release.video_url);
  const shareUrl = `${BASE_URL}/music/${release.slug}`;
  const structuredData = [
    releaseJsonLd({
      name: release.title,
      url: shareUrl,
      releaseType: release.release_type,
      description: release.description,
      image: absoluteCover,
      datePublished: release.release_date,
      sameAs: [
        release.spotify_url,
        release.apple_music_url,
        release.youtube_url,
        release.soundcloud_url,
        release.beatport_url,
      ],
      artistName: SITE_NAME,
      artistUrl: BASE_URL,
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, url: BASE_URL },
      { name: 'Music', url: `${BASE_URL}/music` },
      { name: release.title, url: shareUrl },
    ]),
  ];

  return (
    <div className="flex flex-col w-full">
      {structuredData.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-square rounded-[var(--radius-card-lg)] overflow-hidden border border-[var(--border-on-dark)] bg-black/40">
              {cover ? (
                <Image
                  src={cover}
                  alt={`${release.title} cover art`}
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
              <p className="section-label mb-3 capitalize">
                {release.release_type}
                {release.release_date &&
                  ` · ${new Date(release.release_date).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}`}
              </p>
              <h1 className="type-h1 text-[var(--text)]">{release.title}</h1>
              <StreamingLinks release={release} className="mt-8" />
            </div>
          </Reveal>
        </Container>
      </section>

      {(release.description || release.credits || embedId) && (
        <section className="band-sand">
          <Container className="section-padding">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-10">
                {release.description && (
                  <Reveal>
                    <h2 className="type-h2 text-[var(--text)]">The story</h2>
                    <div className="mt-4 space-y-4 prose-readability">
                      {release.description.split(/\n\n+/).filter(Boolean).map((para, i) => (
                        <p key={i} className="type-body text-[var(--text-muted)]">
                          {para}
                        </p>
                      ))}
                    </div>
                  </Reveal>
                )}

                {embedId && (
                  <Reveal>
                    <h2 className="type-h2 text-[var(--text)]">Video</h2>
                    <div className="mt-4 relative aspect-video rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-subtle)]">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${embedId}`}
                        title={`${release.title} — official video`}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </Reveal>
                )}
              </div>

              {release.credits && (
                <Reveal>
                  <h2 className="type-h3 text-[var(--text)]">Credits</h2>
                  <p className="type-small mt-4 whitespace-pre-line">{release.credits}</p>
                </Reveal>
              )}
            </div>

            <Reveal className="mt-14">
              <Link
                href="/music"
                className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
              >
                ← All music
              </Link>
            </Reveal>
          </Container>
        </section>
      )}
    </div>
  );
}
