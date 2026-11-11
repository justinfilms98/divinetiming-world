import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { JournalPlayer } from '@/components/journal/JournalPlayer';
import { createClient } from '@/lib/supabase/server';
import { getGalleryMedia } from '@/lib/content/server';
import { isJournalPublic } from '@/lib/journal/settings';
import { episodeLabel, playerUrlFor, upcomingDateLabel, watchUrlFor } from '@/lib/journal/rules';
import { getPublicJournalEpisode, getPublicJournalEpisodes, getPublishedJournalVideo } from '@/lib/journal/server';
import type { PublicJournalEpisode } from '@/lib/journal/types';
import { displayImageUrl } from '@/lib/media/webCopies';
import { breadcrumbJsonLd, videoObjectJsonLd } from '@/lib/seo/jsonld';
import { absoluteImageUrl, BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> | { slug: string } };

function episodeTitle(episode: Pick<PublicJournalEpisode, 'episode_number' | 'title'>): string {
  return episode.episode_number ? `Episode ${episode.episode_number} — ${episode.title}` : episode.title;
}

/** Only intentionally public episodes reach metadata; drafts and archived episodes never do. */
async function loadEpisode(params: Params['params']) {
  if (!(await isJournalPublic())) return null;
  const { slug } = await Promise.resolve(params);
  return getPublicJournalEpisode(slug);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const episode = await loadEpisode(params);
  if (!episode) return { title: 'Journal', robots: { index: false } };

  const path = `/journal/${episode.slug}`;
  const title = episode.seo_title || episodeTitle(episode);
  const description = (episode.seo_description || episode.summary || `${title} — the ${SITE_NAME} Journal.`).slice(0, 160);
  const ogImage = absoluteImageUrl(displayImageUrl(episode.cover_image_url)) ?? DEFAULT_OG_IMAGE;
  const comingSoon = episode.status === 'coming_soon';

  return {
    title: `${title} | Journal`,
    description,
    alternates: { canonical: path },
    // Teasers aren't indexed until the episode is out; crawlers may still follow their links.
    ...(comingSoon && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${title} | ${SITE_NAME} Journal`,
      description,
      url: path,
      type: comingSoon ? 'website' : 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: episode.cover_alt || title }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME} Journal`, description, images: [ogImage] },
  };
}

async function publishedCollection(galleryId: string | null) {
  if (!galleryId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('galleries').select('id, name, slug, status').eq('id', galleryId).eq('status', 'published').maybeSingle();
  if (!data) return null;
  const media = (await getGalleryMedia(data.id))
    .filter((m) => m.media_type !== 'video')
    .map((m) => ({ id: m.id, caption: m.caption, src: m.thumbnail_url || m.url }))
    .filter((m): m is { id: string; caption: string | null; src: string } => !!m.src)
    .slice(0, 6);
  return { ...(data as { id: string; name: string; slug: string }), media };
}

export default async function JournalEpisodePage({ params }: Params) {
  const episode = await loadEpisode(params);
  if (!episode) notFound();

  const comingSoon = episode.status === 'coming_soon';
  const cover = displayImageUrl(episode.cover_image_url);
  const label = episodeLabel(episode);
  const title = episodeTitle(episode);
  const shareUrl = `${BASE_URL}/journal/${episode.slug}`;

  const [video, collection, all] = await Promise.all([
    comingSoon ? Promise.resolve(null) : getPublishedJournalVideo(episode),
    comingSoon ? Promise.resolve(null) : publishedCollection(episode.gallery_id),
    comingSoon ? Promise.resolve([]) : getPublicJournalEpisodes(),
  ]);
  const published = all.filter((e) => e.status === 'published');
  const at = published.findIndex((e) => e.id === episode.id);
  const newer = at > 0 ? published[at - 1] : null;
  const older = at >= 0 && at < published.length - 1 ? published[at + 1] : null;

  const videoData = video
    ? videoObjectJsonLd({
        status: episode.status,
        name: title,
        description: episode.summary,
        thumbnailUrl: absoluteImageUrl(cover) ?? null,
        uploadDate: episode.published_at,
        embedUrl: playerUrlFor(video.provider, video.video_id).split('?')[0],
        watchUrl: watchUrlFor(video.provider, video.video_id),
        durationSeconds: video.duration_seconds,
      })
    : null;
  const structuredData = [
    breadcrumbJsonLd([
      { name: SITE_NAME, url: BASE_URL },
      { name: 'Journal', url: `${BASE_URL}/journal` },
      { name: title, url: shareUrl },
    ]),
    ...(videoData ? [videoData] : []),
  ];
  const when = comingSoon
    ? episode.release_note || upcomingDateLabel(episode.scheduled_for) || 'Coming soon'
    : episode.published_at
      ? new Date(episode.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      : null;

  return (
    <div className="flex flex-col w-full">
      {structuredData.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}

      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal>
            <Link href="/journal" className="type-button text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded">
              ← Journal
            </Link>
            <p className="section-label mt-6 mb-3">{[label, when].filter(Boolean).join(' · ')}</p>
            <h1 className="type-h1 text-[var(--text)]">{episode.title}</h1>
            {episode.summary && <p className="type-body text-[var(--text-muted)] mt-4 max-w-[60ch]">{episode.summary}</p>}
          </Reveal>

          <Reveal className="mt-10">
            {video ? (
              <JournalPlayer provider={video.provider} videoId={video.video_id} title={title} coverUrl={cover} vertical={video.is_vertical} />
            ) : (
              cover && (
                <div className="relative aspect-video rounded-[var(--radius-card)] overflow-hidden border border-[var(--border-on-dark)] bg-black">
                  <Image src={cover} alt={episode.cover_alt || ''} fill priority sizes="(max-width: 768px) 100vw, 900px" className="object-cover" />
                  {comingSoon && (
                    <span className="absolute left-4 top-4 rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      Coming soon
                    </span>
                  )}
                </div>
              )
            )}
          </Reveal>

          {comingSoon && (
            <Reveal className="mt-10">
              <Link href="/#tribe" className="inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] border-2 border-[var(--accent)]/50 px-5 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent)]/10 focus-ring">
                Join the tribe to hear first
              </Link>
            </Reveal>
          )}
        </Container>
      </section>

      {!comingSoon && (episode.description || collection) && (
        <section className="band-sand">
          <Container className="section-padding">
            {episode.description && (
              <Reveal>
                <div className="space-y-4 prose-readability max-w-[68ch]">
                  {episode.description.split(/\n\s*\n+/).filter(Boolean).map((para, i) => (
                    <p key={i} className="type-body text-[var(--text-muted)] whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </Reveal>
            )}

            {collection && collection.media.length > 0 && (
              <Reveal className="mt-12">
                <h2 className="type-h2 text-[var(--text)]">Photos</h2>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {collection.media.map((m) => (
                    <div key={m.id} className="relative aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden bg-black/10">
                      <Image src={displayImageUrl(m.src)} alt={m.caption || ''} fill loading="lazy" sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                    </div>
                  ))}
                </div>
                <Link href={`/collections/${collection.slug}`} className="mt-6 inline-flex min-h-[44px] items-center type-button text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded">
                  See the full collection: {collection.name} →
                </Link>
              </Reveal>
            )}
          </Container>
        </section>
      )}

      {!comingSoon && (newer || older) && (
        <section className="band-night">
          <Container className="py-10">
            <nav aria-label="More episodes" className="flex flex-col sm:flex-row justify-between gap-4">
              {older ? (
                <Link href={`/journal/${older.slug}`} className="min-h-[44px] inline-flex items-center text-[var(--text-muted)] hover:text-[var(--accent)] focus-ring rounded">
                  ← {episodeTitle(older)}
                </Link>
              ) : <span />}
              {newer && (
                <Link href={`/journal/${newer.slug}`} className="min-h-[44px] inline-flex items-center text-[var(--text-muted)] hover:text-[var(--accent)] focus-ring rounded sm:text-right">
                  {episodeTitle(newer)} →
                </Link>
              )}
            </nav>
          </Container>
        </section>
      )}
    </div>
  );
}
