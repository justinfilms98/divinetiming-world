'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { UniversalUploader } from '@/components/admin/UniversalUploader';
import { MediaAssetRenderer, HeroEclipseFallback } from '@/components/ui/MediaAssetRenderer';
import { revalidatePaths } from '@/lib/revalidate';
import Link from 'next/link';
import { Save, Check, X } from 'lucide-react';

const PAGE_SLUGS = ['home', 'events', 'media', 'shop', 'booking', 'about'] as const;
const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  events: 'Events',
  media: 'Media',
  shop: 'Shop',
  booking: 'Booking',
  about: 'About',
};

interface HeroSection {
  id: string;
  page_slug: string;
  media_type: string;
  media_url: string | null;
  external_media_asset_id: string | null;
  overlay_opacity: number;
  headline: string | null;
  subtext: string | null;
  animation_type: string;
  animation_enabled: boolean;
}

export default function AdminHeroesPage() {
  const [heroSections, setHeroSections] = useState<Record<string, HeroSection>>({});
  const [selectedSlug, setSelectedSlug] = useState<string>('home');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadHeroes();
  }, []);

  const loadHeroes = async () => {
    const { data } = await supabase.from('hero_sections').select('*');
    const map: Record<string, HeroSection> = {};
    (data || []).forEach((h: HeroSection) => {
      map[h.page_slug] = h;
    });
    setHeroSections(map);
    if (!selectedSlug && data?.length) setSelectedSlug('home');
  };

  const hero = selectedSlug ? heroSections[selectedSlug] : null;

  const handleReplaceMedia = (assets: { id: string; preview_url: string; mime_type: string | null }[]) => {
    const asset = assets[0];
    if (!asset || !selectedSlug) return;
    const mediaType = asset.mime_type?.startsWith('video/') ? 'video' : 'image';
    setHeroSections((prev) => ({
      ...prev,
      [selectedSlug]: {
        ...prev[selectedSlug],
        media_url: asset.preview_url,
        media_type: mediaType,
        external_media_asset_id: asset.id,
      } as HeroSection,
    }));
  };

  const handleRemoveMedia = () => {
    if (!selectedSlug) return;
    setHeroSections((prev) => ({
      ...prev,
      [selectedSlug]: {
        ...prev[selectedSlug],
        media_url: null,
        media_type: 'default',
        external_media_asset_id: null,
      } as HeroSection,
    }));
  };

  const handleSave = async () => {
    if (!hero) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('hero_sections')
      .update({
        media_type: hero.media_type,
        media_url: hero.media_url,
        external_media_asset_id: hero.external_media_asset_id ?? null,
        overlay_opacity: hero.overlay_opacity,
        headline: hero.headline,
        subtext: hero.subtext,
        animation_type: hero.animation_type,
        animation_enabled: hero.animation_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hero.id);

    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      const path = selectedSlug === 'home' ? '/' : `/${selectedSlug}`;
      await revalidatePaths([path]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const updateHero = (updates: Partial<HeroSection>) => {
    if (!selectedSlug) return;
    setHeroSections((prev) => ({
      ...prev,
      [selectedSlug]: { ...prev[selectedSlug], ...updates } as HeroSection,
    }));
  };

  return (
    <>
      <PageHeader
        title="Hero Manager"
        description="Set hero image or video, overlay, and copy for each page"
        actions={
          <Link
            href="/admin/pages"
            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            ← Page Settings
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: page list */}
        <div className="lg:w-56 flex-shrink-0">
          <AdminCard className="p-2">
            {PAGE_SLUGS.map((slug) => (
              <button
                key={slug}
                onClick={() => setSelectedSlug(slug)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedSlug === slug
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                {PAGE_LABELS[slug]}
              </button>
            ))}
          </AdminCard>
        </div>

        {/* Right: preview + form */}
        <div className="flex-1 min-w-0">
          {!hero ? (
            <AdminCard>
              <p className="text-white/60">Loading…</p>
            </AdminCard>
          ) : (
            <>
              <AdminCard className="mb-6">
                <h3 className="text-sm font-medium text-white/80 mb-3">Hero preview</h3>
                <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-black/40 border border-white/10">
                  {hero.media_url && hero.media_type !== 'default' ? (
                    <MediaAssetRenderer
                      url={hero.media_url}
                      mediaType={hero.media_type}
                      alt=""
                      fallback={HeroEclipseFallback}
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0">{HeroEclipseFallback}</div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <UniversalUploader
                    acceptedTypes={['image', 'video']}
                    multiple={false}
                    onSelected={handleReplaceMedia}
                    buttonLabel="Replace Hero Media"
                  />
                  {hero.media_url && hero.media_type !== 'default' && (
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="flex items-center gap-2 px-4 py-2 text-red-400/90 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </AdminCard>

              <AdminCard>
                <h3 className="text-sm font-medium text-white/80 mb-4">Overlay & copy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1">
                      Overlay: {Math.round((hero.overlay_opacity ?? 0.4) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={hero.overlay_opacity ?? 0.4}
                      onChange={(e) => updateHero({ overlay_opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Headline</label>
                    <input
                      type="text"
                      value={hero.headline ?? ''}
                      onChange={(e) => updateHero({ headline: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      placeholder="Page headline"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Subtext</label>
                    <input
                      type="text"
                      value={hero.subtext ?? ''}
                      onChange={(e) => updateHero({ subtext: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      placeholder="Optional subtext"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Animation</label>
                    <select
                      value={hero.animation_type}
                      onChange={(e) => updateHero({ animation_type: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    >
                      <option value="warp">Warp</option>
                      <option value="clock">Clock</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hero.animation_enabled}
                      onChange={(e) => updateHero({ animation_enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-white/70 text-sm">Animation enabled</span>
                  </label>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50 text-sm"
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save'}
                      </>
                    )}
                  </button>
                </div>
              </AdminCard>
            </>
          )}
        </div>
      </div>
    </>
  );
}
