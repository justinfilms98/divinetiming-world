import { createClient } from '@/lib/supabase/server';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Container } from '@/components/ui/Container';
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Press Kit | Divine Timing',
    description: 'Press kit and media resources for Divine Timing.',
  },
};

export default async function PressKitPage() {
  const supabase = await createClient();

  const { data: presskit } = await supabase
    .from('presskit')
    .select('*')
    .single();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <main className="pt-24 md:pt-28 pb-20 min-w-0">
      <Container>
      <GlassPanel className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center tracking-tight">
          {presskit?.title || 'PRESS KIT'}
        </h1>

        <div className="space-y-12">
          {/* BIO */}
          {presskit?.bio_text && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">BIO</h2>
              <div className="text-white/90 leading-relaxed whitespace-pre-line">
                {presskit.bio_text}
              </div>
            </div>
          )}

          {/* EXPERIENCE */}
          {presskit?.experience_text && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">EXPERIENCE</h2>
              <div className="text-white/90 leading-relaxed whitespace-pre-line">
                {presskit.experience_text}
              </div>
            </div>
          )}

          {/* Audience */}
          {presskit?.audience_text && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">AUDIENCE</h2>
              <div className="text-white/90 leading-relaxed whitespace-pre-line">
                {presskit.audience_text}
              </div>
            </div>
          )}

          {/* Links */}
          {presskit?.links_text && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">LINKS</h2>
              <div className="text-white/90 leading-relaxed whitespace-pre-line">
                {presskit.links_text}
              </div>
            </div>
          )}

          {/* Tech Rider */}
          {presskit?.tech_rider_text && (
            <div>
              <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">TECH RIDER</h2>
              <div className="text-white/90 leading-relaxed whitespace-pre-line">
                {presskit.tech_rider_text}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div>
            <h2 className="text-2xl font-bold text-[var(--accent)] mb-4 tracking-wider uppercase">LINKS</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href={settings?.instagram_url || 'https://www.instagram.com/divinetiming_ofc'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[var(--accent)] transition-colors"
              >
                Instagram
              </a>
              <a
                href={settings?.youtube_url || 'https://www.youtube.com/@divinetimingworld'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[var(--accent)] transition-colors"
              >
                YouTube
              </a>
              <a
                href={settings?.spotify_url || 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[var(--accent)] transition-colors"
              >
                Spotify
              </a>
              <a
                href={settings?.apple_music_url || 'https://music.apple.com/es/artist/divine-timing/1851580045'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[var(--accent)] transition-colors"
              >
                Apple Music
              </a>
            </div>
          </div>

          {/* PDF Download */}
          {presskit?.pdf_url && (
            <div>
              <a
                href={presskit.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent2)] transition-colors font-semibold"
              >
                Download PDF Press Kit
              </a>
            </div>
          )}
        </div>
      </GlassPanel>
      </Container>
      </main>
    </div>
  );
}
