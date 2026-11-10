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
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminDialog } from '@/components/admin/AdminDialog';
import { useUnsavedChangesGuard } from '@/components/admin/useUnsavedChangesGuard';
import { compressImage } from '@/lib/utils/compressMedia';
import type { HeroSlot } from '@/lib/types/content';
import { IMMUTABLE_CACHE_SECONDS } from '@/lib/media/cache';
import {
  activeHeroSlotCount,
  clearHeroSlot,
  heroSlotAt,
  heroSlotFromMedia,
  heroSlotState,
  setHeroSlotEnabled,
  withHeroSlot,
} from '@/lib/hero/heroSlots';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { describeSaveError } from '@/lib/admin/saveErrors';

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
      <div className="w-40 h-40 sm:w-64 sm:h-64 rounded-full border-2 border-white/20" />
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
              className="admin-tap flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-500"
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
        <button type="button" onClick={copyUrl} className="admin-tap flex items-center gap-1 px-2 py-1 rounded bg-slate-300 text-slate-700 text-xs hover:bg-slate-400">
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  /** Pages with edits not yet saved with the Save button. */
  const [dirtyPages, setDirtyPages] = useState<ReadonlySet<string>>(new Set());
  /** Home carousel slot whose change is being saved (slot actions save immediately). */
  const [slotBusy, setSlotBusy] = useState<number | null>(null);
  const [slotUploading, setSlotUploading] = useState<number | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<number, string | null>>({});
  /** Slot whose "Choose from library" picker is open. */
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const supabase = createClient();
  const { showToast } = useAdminToast();
  const dialog = useAdminDialog();
  /** Latest state for async slot handlers, so two quick slot actions never overwrite each other. */
  const heroSectionsRef = useRef(heroSections);
  useEffect(() => {
    heroSectionsRef.current = heroSections;
  }, [heroSections]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('hero_sections')
      .select('*')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message || 'Could not load hero settings.');
          return;
        }
        const map: Record<string, HeroSection> = {};
        (data || []).forEach((h: HeroSection) => {
          map[h.page_slug] = h;
        });
        setLoadError(null);
        setHeroSections(map);
        heroSectionsRef.current = map;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on explicit retry
  }, [loadAttempt]);

  const markDirty = useCallback(
    (page: string) => setDirtyPages((prev) => (prev.has(page) ? prev : new Set(prev).add(page))),
    []
  );
  const markClean = useCallback(
    (page: string) =>
      setDirtyPages((prev) => {
        if (!prev.has(page)) return prev;
        const next = new Set(prev);
        next.delete(page);
        return next;
      }),
    []
  );

  const hasUnsaved = dirtyPages.size > 0;
  useUnsavedChangesGuard(
    hasUnsaved,
    `You have unsaved hero changes on: ${[...dirtyPages].map((p) => PAGE_LABELS[p] ?? p).join(', ')}. Leaving now discards them.`
  );

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
        showToast('error', 'Poster must be an image (PNG, JPEG, or WebP).');
        return;
      }
      setPosterUploading(true);
      try {
        const optimized = await compressImage(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1920 });
        const pathRes = await fetch('/api/admin/hero-slot/upload-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            page_slug: selectedPage,
            slot_index: '1',
            kind: 'poster',
            filename: file.name,
          }),
        });
        const pathData = await parseJsonResponse(pathRes, 'Poster upload failed');
        if (!pathRes.ok || !pathData?.path) {
          throw new Error((pathData?.error as string) || 'Could not get upload path');
        }
        const { path } = pathData as { path: string };
        // Timestamped slot path from /api/admin/hero-slot/upload-path: unique, never overwritten.
        const { error: uploadErr } = await supabase.storage.from('media').upload(path, optimized, {
          contentType: optimized.type || file.type || 'image/jpeg',
          cacheControl: IMMUTABLE_CACHE_SECONDS,
          upsert: false,
        });
        if (uploadErr) throw new Error(uploadErr.message || 'Storage upload failed');
        setPosterStoragePath(path);
        markDirty(selectedPage);
      } catch (err) {
        showToast('error', `Poster not uploaded: ${err instanceof Error ? err.message : 'upload failed'}. Nothing was changed — try again.`);
      } finally {
        setPosterUploading(false);
      }
    },
    [selectedPage, showToast, markDirty]
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
    markDirty(selectedPage);
  };

  const handleRemoveMedia = () => {
    if (!selectedPage) return;
    markDirty(selectedPage);
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
    markDirty(selectedPage);
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
    const normalizedSlots = selectedPage === 'home'
      ? (Array.isArray(current.hero_slots) ? current.hero_slots : [])
      : buildSingleHeroSlots(current);
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
        showToast(
          'error',
          describeSaveError({ status: res.status, serverMessage: msg, subject: `the ${PAGE_LABELS[selectedPage] ?? selectedPage} hero` })
        );
        return;
      }
      if (data.hero && typeof data.hero === 'object' && !Array.isArray(data.hero)) {
        const heroUpdate = data.hero as Record<string, unknown>;
        setHeroSections((prev) => ({
          ...prev,
          [selectedPage]: { ...prev[selectedPage], ...heroUpdate },
        }));
      }
      markClean(selectedPage);
      const path = selectedPage === 'home' ? '/' : `/${selectedPage}`;
      await revalidatePaths([path]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast(
        'error',
        describeSaveError({ status: 0, subject: `the ${PAGE_LABELS[selectedPage] ?? selectedPage} hero` })
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Saves only the home carousel slots. The server changes nothing else, and only the returned
   * slots are merged back, so unsaved logo, overlay and text edits stay in the editor.
   */
  const saveHomeSlots = async (
    slotNum: number,
    nextSlots: HeroSlot[],
    successMessage: string,
    failureNote = 'The slot was not changed.'
  ): Promise<boolean> => {
    setSlotBusy(slotNum);
    setSlotErrors((prev) => ({ ...prev, [slotNum]: null }));
    const fail = (status: number, serverMessage?: unknown) => {
      const msg = `${describeSaveError({ status, serverMessage, subject: `slot ${slotNum}`, editsKept: false })} ${failureNote}`;
      setSlotErrors((prev) => ({ ...prev, [slotNum]: msg }));
      showToast('error', msg);
      return false;
    };
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ page_slug: 'home', hero_slots: nextSlots }),
      });
      const data = await parseJsonResponse(res, 'Slot save failed');
      if (!res.ok) return fail(res.status, data?.error);
      const savedHero = data.hero as Partial<HeroSection> | undefined;
      const savedSlots = Array.isArray(savedHero?.hero_slots) ? savedHero.hero_slots : nextSlots;
      setHeroSections((prev) => {
        const next = { ...prev, home: { ...prev.home, hero_slots: savedSlots } as HeroSection };
        heroSectionsRef.current = next;
        return next;
      });
      showToast('success', successMessage);
      return true;
    } catch {
      return fail(0);
    } finally {
      setSlotBusy(null);
    }
  };

  /** Put an uploaded or library file into slot N and show it. */
  const setSlotMedia = async (
    slotNum: number,
    media: { url: string; mimeType?: string | null },
    source: 'upload' | 'library'
  ) => {
    const current = heroSectionsRef.current.home;
    if (!current?.id) {
      showToast('error', 'Hero settings have not loaded yet, so the slot was not saved. Refresh and try again.');
      return;
    }
    const slot = heroSlotFromMedia(slotNum, media.url, media.mimeType);
    if (!slot) {
      showToast('error', `Slot ${slotNum} can only show an image or a video. Choose a different file.`);
      return;
    }
    await saveHomeSlots(
      slotNum,
      withHeroSlot(current.hero_slots, slotNum, slot),
      `Slot ${slotNum} now shows this ${slot.media_type}.`,
      source === 'upload'
        ? `The uploaded file is safe in the Media Library; choose it for slot ${slotNum} again to retry.`
        : 'The slot was not changed.'
    );
  };

  const handleSlotUploaded = (slotNum: number, files: UploadedFile[]) => {
    const file = files[0];
    if (file) void setSlotMedia(slotNum, { url: file.url, mimeType: file.mimeType }, 'upload');
  };

  const handleSlotToggle = async (slotNum: number, show: boolean) => {
    const current = heroSectionsRef.current.home;
    if (!current) return;
    await saveHomeSlots(
      slotNum,
      setHeroSlotEnabled(current.hero_slots, slotNum, show),
      show
        ? `Slot ${slotNum} is now showing on the homepage.`
        : `Slot ${slotNum} is hidden from the homepage. Its media is kept — turn it back on any time.`
    );
  };

  const handleSlotRemove = async (slotNum: number) => {
    const confirmed = await dialog.confirm({
      title: `Remove the media from slot ${slotNum}?`,
      message:
        'The slot becomes empty and is not shown on the homepage. The file itself stays in the Media Library and is not deleted. To keep the media but stop showing it, use "Show on homepage" instead.',
      confirmLabel: 'Remove media',
      tone: 'danger',
    });
    if (!confirmed) return;
    const current = heroSectionsRef.current.home;
    if (!current) return;
    await saveHomeSlots(
      slotNum,
      clearHeroSlot(current.hero_slots, slotNum),
      `Slot ${slotNum} is now empty. The file is still in the Media Library.`
    );
  };

  const overlayPct = hero
    ? Math.round((hero.overlay_opacity ?? 0.4) * 100)
    : 40;

  return (
    <AdminCard className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white tracking-tight mb-1">Page hero</h2>
          <p className="text-white/50 text-sm">
            Choose a page, then edit media, overlay, label, headline, and primary CTA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className="admin-tap flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 hover:text-slate-700"
          aria-expanded={helpOpen}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {helpOpen ? 'Hide help' : 'Where do uploads go?'}
          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', helpOpen && 'rotate-90')} />
        </button>
      </div>
      {helpOpen && (
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-600 space-y-2">
          <p><strong>Upload</strong> stores files in site storage (Supabase). Videos over ~3MB are auto-compressed to 720p web MP4 before upload (first run loads the compressor — allow up to a minute).</p>
          <p><strong>Replace</strong> / &quot;Choose from library&quot; use the media library; you can also pick from cloud drives (e.g. Google Drive) if your file picker supports it.</p>
        </div>
      )}

      {/* Page selector — pill tabs */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Select page</p>
        <div
          className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl w-fit"
          role="tablist"
          aria-label="Select page to edit"
        >
          {PAGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selectedPage === key}
              onClick={() => setSelectedPage(key)}
              className={`admin-tap px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPage === key
                  ? 'bg-[#C6A75E] text-[#0a0a0a] font-semibold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {PAGE_LABELS[key]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/60">
          Editing <span className="text-white font-medium">{PAGE_LABELS[selectedPage]}</span>
          {selectedPage === 'home'
            ? ' — logo, carousel slots, overlay, and copy'
            : ' — single media, overlay, and copy'}
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
          <p className="font-medium">Couldn&apos;t load the hero settings. Nothing has been changed.</p>
          <p className="mt-1 text-red-200/80">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((n) => n + 1)}
            className="admin-tap mt-3 min-h-11 rounded-lg border border-red-300/40 px-4 text-sm font-medium text-white hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      ) : !hero ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Single hero media — non-home pages only.
              Home uses the Carousel Slots section below as the canonical media source. */}
          {selectedPage !== 'home' && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">
                Hero media & copy
              </h3>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
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
                  compression="hero"
                  onSelected={handleReplaceMedia}
                  onUploadingChange={setUploadInProgress}
                  buttonLabel="Upload image or video"
                  hideStorageTip
                />
                {(heroMediaDisplayUrl || hero.media_url) && hero.media_type !== 'default' && (
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="admin-tap px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200"
                    title="Remove hero media and use default"
                  >
                    Remove hero media
                  </button>
                )}
              </div>
            </div>
          )}

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
                  <p className="text-xs text-slate-500 truncate min-w-0 max-w-full sm:max-w-xs" title={heroLogoDisplayUrl ?? hero.hero_logo_url ?? undefined}>
                    Source: {hero.hero_logo_storage_path ? `Storage: ${hero.hero_logo_storage_path}` : hero.hero_logo_url}
                  </p>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
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
                      className="admin-tap px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 w-fit"
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

          {/* Carousel Slots (home only) */}
          {selectedPage === 'home' && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm">Homepage slides</h3>
                  <p className="text-white/60 text-sm mt-0.5 max-w-2xl">
                    Up to three slots, each an image or a video. Show one slot for a single still or video; show two or three for a slideshow. Videos move on when they finish; images hold for 10 seconds.
                  </p>
                </div>
                {(() => {
                  const showing = activeHeroSlotCount(hero?.hero_slots);
                  return (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#C6A75E]/20 text-[#C6A75E] border border-[#C6A75E]/30" data-hero-mode>
                      {showing === 0 ? 'No slides showing' : showing === 1 ? 'Single hero' : `Slideshow · ${showing} slides`}
                    </span>
                  );
                })()}
              </div>
              <p className="text-white/50 text-xs mb-4">
                Slot changes save immediately. Removing media never deletes the file — it stays in the Media Library.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((slotNum) => {
                  const state = heroSlotState(heroSlotAt(hero?.hero_slots, slotNum));
                  const busy = slotBusy === slotNum || slotUploading === slotNum;
                  const slotError = slotErrors[slotNum];
                  const fileName = state.kind === 'empty' ? null : decodeURIComponent(state.url.split('/').pop() ?? '');

                  const hasMedia = state.kind !== 'empty';
                  const typeLabel = hasMedia ? (state.mediaType === 'video' ? 'Video' : 'Image') : null;

                  return (
                    <div
                      key={slotNum}
                      className={cn(
                        'rounded-xl border overflow-hidden',
                        state.kind === 'active' ? 'border-white/10 bg-white/[0.03]' : 'border-dashed border-white/15 bg-transparent'
                      )}
                      data-slot-state={state.kind}
                    >
                      <div className="aspect-video relative bg-black/40">
                        {state.kind === 'active' && state.mediaType === 'video' ? (
                          <video
                            src={state.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : hasMedia && state.mediaType === 'image' ? (
                          <img
                            src={state.url}
                            className={cn('absolute inset-0 w-full h-full object-cover', state.kind === 'off' && 'opacity-40 grayscale')}
                            alt={`Slot ${slotNum}`}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-white/50">
                            <Video className="w-8 h-8" aria-hidden />
                            <span className="text-sm">{hasMedia ? 'Hidden video' : 'Empty slot'}</span>
                            {hasMedia && fileName && <span className="text-xs text-white/45 break-all">{fileName}</span>}
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                          Slot {slotNum}
                          {typeLabel && <span className="ml-2 normal-case tracking-normal text-white/50">{typeLabel}</span>}
                          <span
                            className={cn(
                              'ml-2 normal-case tracking-normal',
                              state.kind === 'active' ? 'text-emerald-400' : state.kind === 'off' ? 'text-amber-300' : 'text-white/45'
                            )}
                          >
                            {state.kind === 'active' ? 'Showing' : state.kind === 'off' ? 'Hidden — media kept' : 'Empty'}
                          </span>
                        </p>
                        {hasMedia && (
                          <label className="admin-tap flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white/80">
                            <input
                              type="checkbox"
                              className="h-5 w-5 accent-[#C6A75E]"
                              checked={state.kind === 'active'}
                              disabled={busy}
                              onChange={(e) => handleSlotToggle(slotNum, e.target.checked)}
                            />
                            Show on homepage
                          </label>
                        )}
                        <UniversalUploader
                          acceptedTypes={['video', 'image']}
                          compression="hero"
                          hideStorageTip
                          onSelected={(files) => handleSlotUploaded(slotNum, files)}
                          onUploadingChange={(u) => {
                            setSlotUploading(u ? slotNum : null);
                            setUploadInProgress(u);
                          }}
                          buttonLabel={hasMedia ? 'Replace with a new file' : 'Upload a file'}
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setPickerSlot(slotNum)}
                          className="admin-tap min-h-11 w-full sm:w-auto rounded-lg border border-white/15 px-3 text-sm text-white/80 hover:bg-white/5 disabled:opacity-40"
                        >
                          Choose from library
                        </button>
                        {slotBusy === slotNum && <p className="text-white/60 text-sm" role="status">Saving slot {slotNum}…</p>}
                        {slotError && (
                          <p className="text-sm text-red-300" role="alert">
                            {slotError}
                          </p>
                        )}
                        {hasMedia && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleSlotRemove(slotNum)}
                            className="admin-tap min-h-11 px-3 -mx-1 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/10 text-sm disabled:opacity-40"
                          >
                            Remove media
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {pickerSlot !== null && (
                <MediaLibraryPicker
                  open
                  filter="all"
                  title={`Choose an image or video for slot ${pickerSlot}`}
                  onClose={() => setPickerSlot(null)}
                  onSelect={(asset) => {
                    const slotNum = pickerSlot;
                    setPickerSlot(null);
                    void setSlotMedia(slotNum, { url: asset.preview_url, mimeType: asset.mime_type }, 'library');
                  }}
                />
              )}
            </div>
          )}

          {/* Overlay */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1" htmlFor="hero-overlay">
              Overlay opacity: {overlayPct}%
            </label>
            <input
              id="hero-overlay"
              type="range"
              className="admin-tap w-full max-w-xs"
              min="0"
              max="90"
              value={overlayPct}
              onChange={(e) =>
                updateHero({
                  overlay_opacity: Number(e.target.value) / 100,
                })
              }
              aria-valuemin={0}
              aria-valuemax={90}
              aria-valuenow={overlayPct}
            />
            <p className="text-xs text-white/40 mt-1 max-w-md">
              Darkens the hero media so the label, headline, and CTA stay readable. 0% is none; around 40% is typical.
            </p>
          </div>

          {/* Poster image (for video) — non-home only; home posters live in each carousel slot. */}
          {selectedPage !== 'home' && hero.media_type === 'video' && (
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
                        className="admin-tap inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 w-fit"
                      >
                        <Upload className="w-3 h-3" /> {posterUrl ? 'Replace poster' : 'Upload poster'}
                      </button>
                      {posterUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPosterStoragePath(null);
                            markDirty(selectedPage);
                          }}
                          className="admin-tap px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 w-fit"
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
              <label className="block text-sm font-medium text-white/70 mb-1">
                Label text (optional)
              </label>
              <input
                type="text"
                value={hero.label_text ?? ''}
                onChange={(e) => updateHero({ label_text: e.target.value })}
                className="admin-input w-full px-3 py-2"
                placeholder="e.g. ELECTRONIC DUO — small-caps above headline; leave blank to hide"
              />
              <p className="text-xs text-white/40 mt-1">Shown above the headline on the public hero. If blank, the label is not shown.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={hero.headline ?? ''}
                onChange={(e) => updateHero({ headline: e.target.value })}
                className="admin-input w-full px-3 py-2"
                placeholder="Page headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Subtext
              </label>
              <input
                type="text"
                value={hero.subtext ?? ''}
                onChange={(e) => updateHero({ subtext: e.target.value })}
                className="admin-input w-full px-3 py-2"
                placeholder="Optional subtext"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1" htmlFor="hero-cta-label">
                  Primary CTA label (optional)
                </label>
                <input
                  id="hero-cta-label"
                  type="text"
                  value={hero.cta_text ?? ''}
                  onChange={(e) => { setCtaError(null); updateHero({ cta_text: e.target.value }); }}
                  className={cn('admin-input w-full px-3 py-2', ctaError && 'border-red-400')}
                  placeholder="e.g. Book now"
                  aria-invalid={!!ctaError}
                  aria-describedby={ctaError ? 'cta-error' : 'cta-help'}
                />
                {ctaError && (
                  <p id="cta-error" className="text-xs text-red-400 mt-1" role="alert">
                    {ctaError}
                  </p>
                )}
                <p id="cta-help" className="text-xs text-white/40 mt-1">Required when a URL is set. Both fields are needed to show the button.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1" htmlFor="hero-cta-url">
                  Primary CTA URL (optional)
                </label>
                <input
                  id="hero-cta-url"
                  type="url"
                  value={hero.cta_url ?? ''}
                  onChange={(e) => { setCtaError(null); updateHero({ cta_url: e.target.value }); }}
                  className="admin-input w-full px-3 py-2"
                  placeholder="https://... or /booking"
                />
              </div>
            </div>
          </div>

          <div className="admin-sticky-actions admin-sticky-actions--page items-center">
            {saved && (
              <span className="w-full sm:w-auto text-sm text-green-600 font-medium">Changes saved. Refresh the public page to confirm.</span>
            )}
            {!saved && dirtyPages.has(selectedPage) && (
              <span className="w-full sm:w-auto text-sm text-amber-300 font-medium" role="status">
                Unsaved changes — press Save to keep them.
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploadInProgress || slotBusy !== null}
              className="admin-btn-primary admin-tap flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 text-white"
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
          </div>
        </div>
      )}
    </AdminCard>
  );
}
