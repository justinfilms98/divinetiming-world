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
import { Save, Check, Copy, ImageIcon, Video, Upload, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/ui/cn';
import type { HeroSlot, HeroSlotIndex } from '@/lib/types/content';

const PAGE_KEYS = ['home', 'events', 'media', 'shop', 'booking'] as const;
const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  events: 'Events',
  media: 'Media',
  shop: 'Shop',
  booking: 'Booking',
};

/** Parse response as JSON; on parse error show friendly message (avoids "Unexpected token" from HTML/redirect). */
async function parseJsonResponse(res: Response, fallbackMessage: string): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return data ?? {};
  } catch {
    const msg = res.ok ? fallbackMessage : `${fallbackMessage}. The server returned an unexpected response — check your connection or try again.`;
    return { error: msg };
  }
}

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
  label_text?: string | null;
  headline: string | null;
  subtext: string | null;
  cta_text: string | null;
  cta_url: string | null;
  animation_type: string;
  animation_enabled: boolean;
  hero_slots?: HeroSlot[] | null;
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
  const [helpOpen, setHelpOpen] = useState(false);
  /** Poster for single hero (video only). Synced from hero_slots[0].poster_storage_path; updated on poster upload. */
  const [posterStoragePath, setPosterStoragePath] = useState<string | null>(null);
  const [ctaError, setCtaError] = useState<string | null>(null);
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

  useEffect(() => {
    if (hero?.media_type === 'video' && Array.isArray(hero?.hero_slots) && hero.hero_slots[0]) {
      const path = (hero.hero_slots[0] as { poster_storage_path?: string | null }).poster_storage_path;
      setPosterStoragePath(path ?? null);
    } else {
      setPosterStoragePath(null);
    }
  }, [hero?.media_type, hero?.hero_slots]);

  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const [posterUploading, setPosterUploading] = useState(false);

  const handlePosterUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !selectedPage) return;
      if (!file.type.startsWith('image/')) {
        alert('Poster must be an image (PNG, JPEG, or WebP).');
        return;
      }
      setPosterUploading(true);
      try {
        const form = new FormData();
        form.set('page_slug', selectedPage);
        form.set('slot_index', '1');
        form.set('kind', 'poster');
        form.append('file', file);
        const res = await fetch('/api/admin/hero-slot/upload', { method: 'POST', credentials: 'same-origin', body: form });
        const data = await parseJsonResponse(res, 'Poster upload failed');
        if (!res.ok) throw new Error((data?.error as string) || res.statusText || 'Poster upload failed');
        const path = data?.storage_path as string | undefined;
        if (path) setPosterStoragePath(path);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Poster upload failed');
      } finally {
        setPosterUploading(false);
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

  /** Build single hero_slots array from current hero + poster (single-surface model). */
  const buildSingleHeroSlots = useCallback((cur: HeroSection): HeroSlot[] => {
    const hasMedia = !!(cur.media_url || cur.media_storage_path);
    if (!hasMedia) return [];
    const mediaType = cur.media_type === 'video' ? 'video' : 'image';
    const overlay = typeof cur.overlay_opacity === 'number' ? Math.max(0, Math.min(0.7, cur.overlay_opacity)) : 0.4;
    const slot: HeroSlot = {
      slot_index: 1,
      enabled: true,
      media_type: mediaType,
      image_storage_path: mediaType === 'image' ? (cur.media_storage_path ?? null) : null,
      image_url: mediaType === 'image' ? (cur.media_url ?? null) : null,
      video_storage_path: mediaType === 'video' ? (cur.media_storage_path ?? null) : null,
      poster_storage_path: mediaType === 'video' ? (posterStoragePath ?? (cur.hero_slots?.[0] as HeroSlot | undefined)?.poster_storage_path ?? null) : null,
      embed_provider: null,
      embed_id: null,
      embed_url: null,
      overlay_opacity: overlay,
    };
    return [slot];
  }, [posterStoragePath]);

  const handleSave = async () => {
    const current = selectedPage ? heroSections[selectedPage] : null;
    if (!current) return;
    setCtaError(null);
    const ctaUrlTrim = (current.cta_url ?? '').trim();
    const ctaTextTrim = (current.cta_text ?? '').trim();
    if (ctaUrlTrim && !ctaTextTrim) {
      setCtaError('CTA label is required when CTA URL is set.');
      return;
    }
    const normalizedSlots = buildSingleHeroSlots(current);
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
          label_text: (current.label_text ?? '').trim() || null,
          headline: current.headline ?? null,
          subtext: current.subtext ?? null,
          cta_text: current.cta_text ?? null,
          cta_url: current.cta_url ?? null,
          animation_type: current.animation_type ?? 'warp',
          animation_enabled: current.animation_enabled ?? true,
          hero_slots: normalizedSlots,
        }),
      });
      const data = await parseJsonResponse(res, 'Save failed');
      if (!res.ok) {
        const msg = data?.error || res.statusText || 'Save failed';
        if (res.status === 400 && typeof msg === 'string' && msg.includes('CTA')) {
          setCtaError(msg);
          return;
        }
        alert('Error saving: ' + msg);
        return;
      }
      if (data.hero && typeof data.hero === 'object' && !Array.isArray(data.hero)) {
        const heroUpdate = data.hero as Record<string, unknown>;
        setHeroSections((prev) => ({
          ...prev,
          [selectedPage]: { ...prev[selectedPage], ...heroUpdate },
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
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight mb-1">Hero Editor</h2>
          <p className="text-slate-600 text-sm">
            Single hero per page: media, poster (for video), overlay, page label, headline, and primary CTA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 hover:text-slate-700"
          aria-expanded={helpOpen}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {helpOpen ? 'Hide help' : 'Where do uploads go?'}
          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', helpOpen && 'rotate-90')} />
        </button>
      </div>
      {helpOpen && (
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-600 space-y-2">
          <p><strong>Upload</strong> stores files in site storage (Supabase). Image max 10MB; logo max 2MB.</p>
          <p><strong>Replace</strong> / &quot;Choose from library&quot; use the media library; you can also pick from cloud drives (e.g. Google Drive) if your file picker supports it.</p>
        </div>
      )}

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
          {/* Hero (single surface): media, poster, overlay, label, CTAs */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Hero media & copy
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
              <UniversalUploader
                acceptedTypes={['image', 'video']}
                multiple={false}
                onSelected={handleReplaceMedia}
                onUploadingChange={setUploadInProgress}
                buttonLabel="Upload image or video"
                hideStorageTip
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
                    <UniversalUploader
                      acceptedTypes={['image']}
                      acceptOverride="image/png"
                      multiple={false}
                      maxSizeBytes={2 * 1024 * 1024}
                      onSelected={(files) => {
                        const url = files[0]?.url;
                        if (url) updateHero({ hero_logo_url: url });
                      }}
                      onUploadingChange={setUploadInProgress}
                      buttonLabel="Replace logo"
                      hideStorageTip
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
                <UniversalUploader
                  acceptedTypes={['image']}
                  acceptOverride="image/png"
                  multiple={false}
                  maxSizeBytes={2 * 1024 * 1024}
                  onSelected={(files) => {
                    const url = files[0]?.url;
                    if (url) updateHero({ hero_logo_url: url });
                  }}
                  onUploadingChange={setUploadInProgress}
                  buttonLabel="Upload logo (PNG)"
                  hideStorageTip
                />
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

          {/* Poster image (for video) */}
          {hero.media_type === 'video' && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-1">Poster image (for video)</h3>
              <p className="text-xs text-slate-500 mb-2">Shown before the video plays. Recommended: same aspect as hero (e.g. 21:9).</p>
              {(() => {
                const base = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : '';
                const posterUrl = posterStoragePath && base
                  ? `${base.replace(/\/$/, '')}/storage/v1/object/public/media/${String(posterStoragePath).replace(/^\/+/, '')}`
                  : null;
                return (
                  <div className="flex flex-wrap items-start gap-3">
                    {posterUrl ? (
                      <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 w-48 aspect-video">
                        <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-48 aspect-video rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">No poster</div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={posterFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePosterUpload}
                      />
                      <button
                        type="button"
                        onClick={() => posterFileInputRef.current?.click()}
                        disabled={posterUploading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 w-fit"
                      >
                        <Upload className="w-3 h-3" /> {posterUrl ? 'Replace poster' : 'Upload poster'}
                      </button>
                      {posterUrl && (
                        <button
                          type="button"
                          onClick={() => setPosterStoragePath(null)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 w-fit"
                        >
                          Remove poster
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Copy */}
          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Label text (optional)
              </label>
              <input
                type="text"
                value={hero.label_text ?? ''}
                onChange={(e) => updateHero({ label_text: e.target.value })}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="e.g. ELECTRONIC DUO — small-caps above headline; leave blank to hide"
              />
              <p className="text-xs text-slate-500 mt-1">Shown above the headline on the public hero. If blank, the label is not shown.</p>
            </div>
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
                onChange={(e) => { setCtaError(null); updateHero({ cta_text: e.target.value }); }}
                className={cn('admin-input w-full px-3 py-2 text-slate-800', ctaError && 'border-red-400')}
                placeholder="e.g. Book now"
                aria-invalid={!!ctaError}
                aria-describedby={ctaError ? 'cta-error' : undefined}
              />
              {ctaError && (
                <p id="cta-error" className="text-xs text-red-600 mt-1" role="alert">
                  {ctaError}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Required when CTA URL is set. CTA button is only shown when both label and URL are set.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primary CTA URL (optional)
              </label>
              <input
                type="url"
                value={hero.cta_url ?? ''}
                onChange={(e) => { setCtaError(null); updateHero({ cta_url: e.target.value }); }}
                className="admin-input w-full px-3 py-2 text-slate-800"
                placeholder="https://... or #booking-form"
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
