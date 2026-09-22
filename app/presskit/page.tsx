import { getPressKitBundle, getSiteSettings } from '@/lib/content/server';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/home/SectionHeading';
import { SectionCta } from '@/components/home/SectionCta';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';
import { getPlatformLinks } from '@/lib/platformLinks';
import {
  bookingContact,
  performanceLine,
  presskitLongBio,
  presskitShortBio,
  reelEmbedUrl,
} from '@/lib/presskit/display';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Press Kit',
  description: 'Press kit and media resources for Divine Timing.',
  alternates: { canonical: '/presskit' },
  openGraph: {
    title: 'Press Kit | Divine Timing',
    description: 'Press kit and media resources for Divine Timing.',
    url: '/presskit',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Press Kit | Divine Timing',
    description: 'Press kit and media resources for Divine Timing.',
    images: [DEFAULT_OG_IMAGE],
  },
};

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

export default async function PressKitPage() {
  const [{ kit, assets, releases, performances }, settings] = await Promise.all([
    getPressKitBundle(),
    getSiteSettings(),
  ]);

  const shortBio = presskitShortBio(kit);
  const longBio = presskitLongBio(kit);
  const contact = bookingContact(kit, settings);
  const reel = reelEmbedUrl(kit?.performance_reel_url);
  const photos = assets.filter((a) => a.kind === 'photo' && a.resolved_url);
  const logos = assets.filter((a) => a.kind === 'logo' && a.resolved_url);
  const platformLinks = getPlatformLinks(settings ?? undefined);
  const hasContact = !!(contact.name || contact.email || contact.phone);
  const hasTech = !!(kit?.tech_rider_text?.trim() || kit?.tech_rider_url?.trim());
  const hasHospitality = !!(kit?.hospitality_rider_text?.trim() || kit?.hospitality_rider_url?.trim());
  const onesheet = kit?.pdf_url?.trim() || null;

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <section className="band-night relative overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <Container className="relative section-padding">
          <Reveal className="max-w-2xl">
            <p className="section-label mb-3">Press</p>
            <h1 className="type-h1 text-[var(--text)]">{kit?.title?.trim() || 'Press kit'}</h1>
            {shortBio && (
              <p className="type-subtitle text-[var(--text-muted)] mt-5 prose-readability">{shortBio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-8">
              {onesheet && (
                <SectionCta href={onesheet}>Download one-sheet</SectionCta>
              )}
              <SectionCta href="/booking" variant={onesheet ? 'secondary' : 'primary'}>
                Booking inquiry
              </SectionCta>
            </div>
          </Reveal>
        </Container>
      </section>

      {longBio && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="Biography" title="The story" />
            </Reveal>
            <Reveal className="mt-8 max-w-3xl space-y-5">
              {splitParagraphs(longBio).map((para, i) => (
                <p key={i} className="type-body text-[var(--text)] prose-readability whitespace-pre-line">
                  {para}
                </p>
              ))}
            </Reveal>
          </Container>
        </section>
      )}

      {kit?.experience_text?.trim() && (
        <section className="band-dune">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="Live" title="The experience" />
            </Reveal>
            <Reveal className="mt-8 max-w-3xl space-y-5">
              {splitParagraphs(kit.experience_text).map((para, i) => (
                <p key={i} className="type-body text-[var(--text)] prose-readability whitespace-pre-line">
                  {para}
                </p>
              ))}
            </Reveal>
          </Container>
        </section>
      )}

      {performances.length > 0 && (
        <section className="band-night relative overflow-hidden">
          <div className="hero-grain" aria-hidden />
          <Container className="relative section-padding">
            <Reveal>
              <SectionHeading
                label="Selected dates"
                title="Notable performances"
                intro="Rooms and festivals the artist has confirmed for press use."
              />
            </Reveal>
            <ul className="mt-10 divide-y divide-[var(--border-subtle)]">
              {performances.map((row) => (
                <li key={row.id} className="py-4 type-body text-[var(--text)]">
                  {performanceLine(row)}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {reel && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="Watch" title="Performance reel" />
            </Reveal>
            <Reveal className="mt-8">
              <div className="relative w-full max-w-3xl aspect-video overflow-hidden rounded-2xl border border-[var(--accent)]/15 bg-[var(--bg)]">
                <iframe
                  src={reel}
                  title="DIVINE:TIMING performance reel"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="type-caption mt-3 text-[var(--text-muted)]">
                Closed captions may be available in the player controls.
              </p>
            </Reveal>
          </Container>
        </section>
      )}

      {(photos.length > 0 || logos.length > 0) && (
        <section className="band-dune">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading
                label="Assets"
                title="Photos and logos"
                intro="High-resolution files from the press library. Right-click or use the download link."
              />
            </Reveal>
            {photos.length > 0 && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((asset) => (
                  <figure key={asset.id} className="space-y-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--accent)]/15 bg-[var(--bg)]">
                      <MediaAssetRenderer
                        url={asset.resolved_url ?? null}
                        mediaType="image"
                        alt={asset.caption || 'Press photo'}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    {asset.caption && (
                      <figcaption className="type-small text-[var(--text-muted)]">{asset.caption}</figcaption>
                    )}
                    {asset.resolved_url && (
                      <a
                        href={asset.resolved_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                      >
                        Download
                      </a>
                    )}
                  </figure>
                ))}
              </div>
            )}
            {logos.length > 0 && (
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-6 ${photos.length > 0 ? 'mt-12' : 'mt-10'}`}>
                {logos.map((asset) => (
                  <figure key={asset.id} className="space-y-3">
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--accent)]/15 bg-[var(--bg)] p-6">
                      <MediaAssetRenderer
                        url={asset.resolved_url ?? null}
                        mediaType="image"
                        alt={asset.caption || 'Logo'}
                        objectFit="contain"
                        sizes="200px"
                      />
                    </div>
                    <a
                      href={asset.resolved_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                    >
                      Download logo
                    </a>
                  </figure>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      {releases.length > 0 && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="News" title="Press releases" />
            </Reveal>
            <ul className="mt-10 space-y-8 max-w-3xl">
              {releases.map((release) => (
                <li key={release.id}>
                  <p className="type-small text-[var(--accent)]">
                    {release.published_at
                      ? new Date(release.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : null}
                  </p>
                  <h3 className="type-h3 text-[var(--text)] mt-1">{release.title}</h3>
                  {release.body_md && (
                    <p className="type-body text-[var(--text-muted)] mt-3 whitespace-pre-line prose-readability">
                      {release.body_md}
                    </p>
                  )}
                  {release.external_url && (
                    <a
                      href={release.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                    >
                      Read full release
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {(hasTech || hasHospitality) && (
        <section className="band-night relative overflow-hidden">
          <div className="hero-grain" aria-hidden />
          <Container className="relative section-padding">
            <Reveal>
              <SectionHeading label="Advance" title="Riders" />
            </Reveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {hasTech && (
                <div>
                  <h3 className="type-h3 text-[var(--text)]">Tech rider</h3>
                  {kit?.tech_rider_text?.trim() && (
                    <p className="type-body text-[var(--text-muted)] mt-4 whitespace-pre-line prose-readability">
                      {kit.tech_rider_text}
                    </p>
                  )}
                  {kit?.tech_rider_url?.trim() && (
                    <a
                      href={kit.tech_rider_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                    >
                      Download tech rider
                    </a>
                  )}
                </div>
              )}
              {hasHospitality && (
                <div>
                  <h3 className="type-h3 text-[var(--text)]">Hospitality rider</h3>
                  {kit?.hospitality_rider_text?.trim() && (
                    <p className="type-body text-[var(--text-muted)] mt-4 whitespace-pre-line prose-readability">
                      {kit.hospitality_rider_text}
                    </p>
                  )}
                  {kit?.hospitality_rider_url?.trim() && (
                    <a
                      href={kit.hospitality_rider_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                    >
                      Download hospitality rider
                    </a>
                  )}
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {(hasContact || platformLinks.length > 0 || kit?.audience_text?.trim() || kit?.links_text?.trim()) && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading label="Contact" title="Booking and links" />
            </Reveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {hasContact && (
                <div className="space-y-2">
                  {contact.name && <p className="type-body text-[var(--text)]">{contact.name}</p>}
                  {contact.email && (
                    <p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="type-body text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                      >
                        {contact.email}
                      </a>
                    </p>
                  )}
                  {contact.phone && (
                    <p className="type-body text-[var(--text-muted)]">{contact.phone}</p>
                  )}
                </div>
              )}
              <div className="space-y-4">
                {kit?.audience_text?.trim() && (
                  <p className="type-body text-[var(--text-muted)] whitespace-pre-line">{kit.audience_text}</p>
                )}
                {kit?.links_text?.trim() && (
                  <p className="type-body text-[var(--text-muted)] whitespace-pre-line">{kit.links_text}</p>
                )}
                {platformLinks.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {platformLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-small font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-ring rounded"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Reveal className="mt-12">
              <SectionCta href="/booking">Start a booking inquiry</SectionCta>
            </Reveal>
          </Container>
        </section>
      )}
    </div>
  );
}
