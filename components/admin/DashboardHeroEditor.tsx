'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminCard } from '@/components/admin/AdminCard';
import {
  UniversalUploader,
  type UploadedFile,
} from '@/components/admin/uploader/UniversalUploader';
import { revalidatePaths } from '@/lib/revalidate';
import { resolveHeroMediaUrl, resolveHeroLogoUrl } from '@/lib/storageUrls';
import { updateHeroMedia, validateHeroFile } from '@/lib/storageUpload';
import { Save, Check, Copy, ImageIcon, Video, Upload } from 'lucide-react';

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
  media_storage_path?: string | null;
  external_media_asset_id: string | null;
  hero_logo_url: string | null;
  hero_logo_storage_path?: string | null;
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

/** Admin-only hero media preview: native img/video, onError shows placeholder + URL + Copy. */
function AdminHeroMediaPreview({
  url,
  mediaType,
  className = '',
}: {
  url: string;
  mediaType: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const isVideo = mediaType === 'video';

  const copyUrl = useCallback(() => {
    if (!url) return;
    navigator.clipboard.writeText(url);
  }, [url]);

  if (error || !url) {
    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800/80 p-4 ${className}`}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 text-slate-400">
          {isVideo ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
        </div>
        <p className="text-slate-400 text-xs text-center">Preview unavailable</p>
        {url && (
          <>
            <p className="text-slate-500 text-xs truncate max-w-full" title={url}>Source URL: {url}</p>
            <button
              type="button"
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-500"
            >
              <Copy className="w-3 h-3" /> Copy URL
            </button>
          </>
        )}
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={url}
      alt="Hero preview"
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

/** Admin-only logo preview with onError fallback and Copy URL. */
function AdminHeroLogoPreview({ url }: { url: string }) {
  const [error, setError] = useState(false);
  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(url);
  }, [url]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 w-32 h-16 bg-slate-200 rounded-lg p-2">
        <ImageIcon className="w-6 h-6 text-slate-400" />
        <p className="text-slate-500 text-xs truncate max-w-full" title={url}>Source: {url}</p>
        <button type="button" onClick={copyUrl} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-300 text-slate-700 text-xs hover:bg-slate-400">
          <Copy className="w-3 h-3" /> Copy
        </button>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Hero logo preview"
      className="max-w-full max-h-full object-contain"
      onError={() => setError(true)}
    />
  );
}

export function DashboardHeroEditor() {
  const [heroSections, setHeroSections] = useState<Record<string, HeroSection>>({});
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
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
  const heroMediaDisplayUrl = hero ? resolveHeroMediaUrl(hero) : null;
  const heroLogoDisplayUrl = hero ? resolveHeroLogoUrl(hero) : null;

  const supabaseMediaInputRef = useRef<HTMLInputElement>(null);
  const supabaseLogoInputRef = useRef<HTMLInputElement>(null);
  const [supabaseUploading, setSupabaseUploading] = useState<'media' | 'logo' | null>(null);

  const handleSupabaseMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !selectedPage) return;
      const err = validateHeroFile(file, 'media');
      if (err) {
        alert(err);
        return;
      }
      setSupabaseUploading('media');
      try {
        const { storagePath } = await updateHeroMedia(selectedPage, file, 'media');
        setHeroSections((prev) => ({
          ...prev,
          [selectedPage]: {
            ...(prev[selectedPage] || ({} as HeroSection)),
            page_slug: selectedPage,
            media_storage_path: storagePath,
            media_type: 'image',
            media_url: prev[selectedPage]?.media_url ?? null,
          } as HeroSection,
        }));
        const path = selectedPage === 'home' ? '/' : `/${selectedPage}`;
        await revalidatePaths([path]);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setSupabaseUploading(null);
      }
    },
    [selectedPage]
  );

  const handleSupabaseLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !selectedPage) return;
      const err = validateHeroFile(file, 'logo');
      if (err) {
        alert(err);
        return;
      }
      setSupabaseUploading('logo');
      try {
        const { storagePath } = await updateHeroMedia(selectedPage, file, 'logo');
        setHeroSections((prev) => ({
          ...prev,
          [selectedPage]: {
            ...(prev[selectedPage] || ({} as HeroSection)),
            page_slug: selectedPage,
            hero_logo_storage_path: storagePath,
            hero_logo_url: prev[selectedPage]?.hero_logo_url ?? null,
          } as HeroSection,
        }));
        const path = selectedPage === 'home' ? '/' : `/${selectedPage}`;
        await revalidatePaths([path]);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setSupabaseUploading(null);
      }
    },
    [selectedPage]
  );

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
        media_storage_path: null,
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
          media_storage_path: current.media_storage_path ?? null,
          external_media_asset_id: current.external_media_asset_id ?? null,
          hero_logo_url: current.hero_logo_url ?? null,
          hero_logo_storage_path: current.hero_logo_storage_path ?? null,
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
              {heroMediaDisplayUrl && hero.media_type !== 'default' ? (
                <AdminHeroMediaPreview
                  url={heroMediaDisplayUrl}
                  mediaType={hero.media_type}
                  className="object-cover w-full h-full min-h-full min-w-0"
                />
              ) : (
                <div className="absolute inset-0">
                  <HeroEclipseFallback />
                </div>
              )}
            </div>
            {heroMediaDisplayUrl && hero.media_type !== 'default' && (
              <p className="mt-1.5 text-xs text-slate-500 truncate" title={heroMediaDisplayUrl}>
                Source: {hero.media_storage_path ? `Storage: ${hero.media_storage_path}` : hero.media_url}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                ref={supabaseMediaInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleSupabaseMediaUpload}
              />
              <button
                type="button"
                onClick={() => supabaseMediaInputRef.current?.click()}
                disabled={!!supabaseUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Upload to Supabase (image, max 10MB)
              </button>
              <UniversalUploader
                acceptedTypes={['image', 'video']}
                multiple={false}
                onSelected={handleReplaceMedia}
                onUploadingChange={setUploadInProgress}
                buttonLabel="Replace hero media (Uploadcare)"
              />
              {(heroMediaDisplayUrl || hero.media_url) && hero.media_type !== 'default' && (
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

          {/* Logo (PNG) — home page only */}
          {selectedPage === 'home' && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">Logo (PNG)</h3>
              <p className="text-slate-500 text-xs mb-2">
                Shown in place of the text title on the home hero. Recommended: 1200px wide (min 600px), transparent background, max 2MB.
              </p>
              {(heroLogoDisplayUrl ?? hero.hero_logo_url ?? null) ? (
                <div className="flex flex-wrap items-start gap-3">
                  <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 w-32 h-16 flex items-center justify-center">
                    <AdminHeroLogoPreview url={heroLogoDisplayUrl ?? hero.hero_logo_url!} />
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-xs" title={heroLogoDisplayUrl ?? hero.hero_logo_url ?? undefined}>
                    Source: {hero.hero_logo_storage_path ? `Storage: ${hero.hero_logo_storage_path}` : hero.hero_logo_url}
                  </p>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={supabaseLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSupabaseLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => supabaseLogoInputRef.current?.click()}
                      disabled={!!supabaseUploading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 w-fit"
                    >
                      <Upload className="w-3 h-3" /> Supabase (max 10MB)
                    </button>
                    <UniversalUploader
                      acceptedTypes={['image']}
                      acceptOverride="image/png,image/svg+xml"
                      multiple={false}
                      maxSizeBytes={2 * 1024 * 1024}
                      onSelected={(files) => {
                        const url = files[0]?.url;
                        if (url) updateHero({ hero_logo_url: url });
                      }}
                      onUploadingChange={setUploadInProgress}
                      buttonLabel="Replace logo (Uploadcare)"
                    />
                    <button
                      type="button"
                      onClick={() => updateHero({ hero_logo_url: null, hero_logo_storage_path: null })}
                      className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 w-fit"
                    >
                      Remove logo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    ref={supabaseLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleSupabaseLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => supabaseLogoInputRef.current?.click()}
                    disabled={!!supabaseUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" /> Upload logo to Supabase (max 10MB)
                  </button>
                  <UniversalUploader
                    acceptedTypes={['image']}
                    acceptOverride="image/png,image/svg+xml"
                    multiple={false}
                    maxSizeBytes={2 * 1024 * 1024}
                    onSelected={(files) => {
                      const url = files[0]?.url;
                      if (url) updateHero({ hero_logo_url: url });
                    }}
                    onUploadingChange={setUploadInProgress}
                    buttonLabel="Upload logo (Uploadcare, PNG/SVG, max 2MB)"
                  />
                </>
              )}
            </div>
          )}

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
              disabled={saving || uploadInProgress}
              className="admin-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 text-white"
              aria-live="polite"
              aria-busy={saving || uploadInProgress}
              title={uploadInProgress ? 'Wait for upload to finish' : undefined}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" aria-hidden />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden />
                  {saving ? 'Saving…' : uploadInProgress ? 'Uploading…' : 'Save'}
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
