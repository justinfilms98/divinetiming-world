'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminCard } from '@/components/admin/AdminCard';
import {
  UniversalUploader,
  type UploadedFile,
} from '@/components/admin/uploader/UniversalUploader';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';
import { revalidatePaths } from '@/lib/revalidate';
import { Save, Check } from 'lucide-react';

const PAGE_KEYS = ['home', 'events', 'media', 'shop', 'booking'] as const;
const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  events: 'Events',
  media: 'Media',
  shop: 'Shop',
  booking: 'Booking',
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
  cta_text: string | null;
  cta_url: string | null;
  animation_type: string;
  animation_enabled: boolean;
}

function HeroEclipseFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900/80 to-black/60">
      <div className="w-64 h-64 rounded-full border-2 border-white/20" />
    </div>
  );
}

export function DashboardHeroEditor() {
  const [heroSections, setHeroSections] = useState<Record<string, HeroSection>>({});
  const [selectedPage, setSelectedPage] = useState<string>('home');
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
  };

  const hero = selectedPage ? heroSections[selectedPage] : null;

  const handleReplaceMedia = (files: UploadedFile[]) => {
    const file = files[0];
    if (!file || !selectedPage) return;
    const mediaType = (file.mimeType || '').startsWith('video/') ? 'video' : 'image';
    setHeroSections((prev) => ({
      ...prev,
      [selectedPage]: {
        ...(prev[selectedPage] || ({} as HeroSection)),
        page_slug: selectedPage,
        media_url: file.url,
        media_type: mediaType,
        external_media_asset_id: file.id ?? null,
      } as HeroSection,
    }));
  };

  const handleRemoveMedia = () => {
    if (!selectedPage) return;
    setHeroSections((prev) => ({
      ...prev,
      [selectedPage]: {
        ...(prev[selectedPage] || ({} as HeroSection)),
        page_slug: selectedPage,
        media_url: null,
        media_type: 'default',
        external_media_asset_id: null,
      } as HeroSection,
    }));
  };

  const updateHero = (updates: Partial<HeroSection>) => {
    if (!selectedPage) return;
    setHeroSections((prev) => ({
      ...prev,
      [selectedPage]: { ...(prev[selectedPage] || {}), ...updates } as HeroSection,
    }));
  };

  const handleSave = async () => {
    const current = selectedPage ? heroSections[selectedPage] : null;
    if (!current) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          page_slug: selectedPage,
          media_type: current.media_type,
          media_url: current.media_url,
          external_media_asset_id: current.external_media_asset_id ?? null,
          overlay_opacity: current.overlay_opacity ?? 0.4,
          headline: current.headline ?? null,
          subtext: current.subtext ?? null,
          cta_text: current.cta_text ?? null,
          cta_url: current.cta_url ?? null,
          animation_type: current.animation_type ?? 'warp',
          animation_enabled: current.animation_enabled ?? true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error saving: ' + (data.error || res.statusText));
        return;
      }
      if (data.hero) {
        setHeroSections((prev) => ({
          ...prev,
          [selectedPage]: { ...prev[selectedPage], ...data.hero },
        }));
      }
      const path = selectedPage === 'home' ? '/' : `/${selectedPage}`;
      await revalidatePaths([path]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const overlayPct = hero
    ? Math.round((hero.overlay_opacity ?? 0.4) * 100)
    : 40;

  return (
    <AdminCard className="mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Hero Editor</h2>
      <p className="text-slate-600 text-sm mb-4">
        Set hero image or video, overlay, and copy for each public page.
      </p>

      {/* Page selector — segmented control */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Page</label>
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 gap-0.5"
          role="group"
          aria-label="Select page"
        >
          {PAGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPage(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPage === key
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              {PAGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {!hero ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Current hero preview */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Current hero
            </h3>
            <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-slate-200 border border-slate-200 flex items-center justify-center">
              {hero.media_url && hero.media_type !== 'default' ? (
                <MediaAssetRenderer
                  url={hero.media_url}
                  mediaType={hero.media_type as 'image' | 'video'}
                  alt=""
                  fallback={<HeroEclipseFallback />}
                  className="object-cover w-full h-full min-h-full min-w-0"
                />
              ) : (
                <div className="absolute inset-0">
                  <HeroEclipseFallback />
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <UniversalUploader
                acceptedTypes={['image', 'video']}
                multiple={false}
                onSelected={handleReplaceMedia}
                buttonLabel="Replace hero media"
              />
              {hero.media_url && hero.media_type !== 'default' && (
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200"
                  title="Remove hero media and use default"
                >
                  Remove hero media
                </button>
              )}
            </div>
          </div>

          {/* Overlay */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Overlay opacity: {overlayPct}%
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={overlayPct}
              onChange={(e) =>
                updateHero({
                  overlay_opacity: Number(e.target.value) / 100,
                })
              }
              className="w-full max-w-xs"
            />
          </div>

          {/* Copy */}
          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={hero.headline ?? ''}
                onChange={(e) => updateHero({ headline: e.target.value })}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="Page headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subtext
              </label>
              <input
                type="text"
                value={hero.subtext ?? ''}
                onChange={(e) => updateHero({ subtext: e.target.value })}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="Optional subtext"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primary CTA label (optional)
              </label>
              <input
                type="text"
                value={hero.cta_text ?? ''}
                onChange={(e) => updateHero({ cta_text: e.target.value })}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="e.g. Book now"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primary CTA URL (optional)
              </label>
              <input
                type="url"
                value={hero.cta_url ?? ''}
                onChange={(e) => updateHero({ cta_url: e.target.value })}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 text-white"
              aria-live="polite"
              aria-busy={saving}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" aria-hidden />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden />
                  {saving ? 'Saving…' : 'Save'}
                </>
              )}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Changes saved. Refresh the public page to confirm.</span>
            )}
          </div>
        </div>
      )}
    </AdminCard>
  );
}
