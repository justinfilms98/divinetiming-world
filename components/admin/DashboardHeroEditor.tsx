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
import { Save, Check, Copy, ImageIcon, Video, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { normalizeHeroEmbed } from '@/lib/embed';
import { normalizeHeroSlots } from '@/lib/content/shared';
import type { HeroSlot, HeroSlotIndex } from '@/lib/types/content';

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
  hero_slots?: HeroSlot[] | null;
}

function HeroEclipseFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900/80 to-black/60">
      <div className="w-64 h-64 rounded-full border-2 border-white/20" />
    </div>
  );
}

const SLOT_DEFAULTS = (i: HeroSlotIndex): HeroSlot => ({
  slot_index: i,
  enabled: true,
  media_type: 'image',
  image_storage_path: null,
  image_url: null,
  video_storage_path: null,
  poster_storage_path: null,
  embed_provider: null,
  embed_id: null,
  embed_url: null,
  overlay_opacity: 0.4,
});

function toHeroSlot(raw: unknown, index: HeroSlotIndex): HeroSlot {
  const base = SLOT_DEFAULTS(index);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const legacyType = r.type as string | undefined;
  const media_type = (r.media_type as HeroSlot['media_type']) ?? (legacyType === 'youtube' ? 'embed' : legacyType === 'image' ? 'image' : undefined) ?? 'image';
  return {
    ...base,
    slot_index: (r.slot_index as HeroSlotIndex) ?? index,
    enabled: r.enabled !== false,
    media_type,
    image_storage_path: (r.image_storage_path as string | null) ?? null,
    image_url: (r.image_url as string | null) ?? null,
    video_storage_path: (r.video_storage_path as string | null) ?? null,
    poster_storage_path: (r.poster_storage_path as string | null) ?? null,
    embed_provider: (r.embed_provider as HeroSlot['embed_provider']) ?? null,
    embed_id: (r.embed_id as string | null) ?? (r.youtube_id as string | null) ?? null,
    embed_url: (r.embed_url as string | null) ?? null,
    overlay_opacity: r.overlay_opacity != null ? Math.max(0, Math.min(0.7, Number(r.overlay_opacity))) : 0.4,
  };
}

function HeroCarouselSlotsEditor({
  hero,
  onSlotsChange,
}: {
  hero: HeroSection | null;
  onSlotsChange: (slots: HeroSlot[]) => void;
}) {
  const raw = hero?.hero_slots ?? [];
  const rawArr = Array.isArray(raw) ? raw : [];
  const slots: HeroSlot[] = [
    toHeroSlot(rawArr[0], 1),
    toHeroSlot(rawArr[1], 2),
    toHeroSlot(rawArr[2], 3),
  ];
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const setSlot = (index: number, update: Partial<HeroSlot>) => {
    const next = slots.map((s, i) => (i === index ? { ...s, ...update } : s));
    onSlotsChange(next);
  };

  const pageSlug = hero?.page_slug ?? 'home';

  const uploadSlotFile = async (slotIndex: number, kind: 'image' | 'video' | 'poster', file: File): Promise<{ storage_path: string; public_url: string } | null> => {
    const form = new FormData();
    form.set('page_slug', pageSlug);
    form.set('slot_index', String(slotIndex + 1));
    form.set('kind', kind);
    form.append('file', file);
    const res = await fetch('/api/admin/hero-slot/upload', { method: 'POST', credentials: 'same-origin', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data.storage_path ? { storage_path: data.storage_path, public_url: data.public_url ?? '' } : null;
  };

  const moveSlot = (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap > 2) return;
    const next = [...slots];
    [next[index], next[swap]] = [next[swap], next[index]];
    next.forEach((slot, i) => { slot.slot_index = (i + 1) as HeroSlotIndex; });
    onSlotsChange(next);
  };

  const resolveSlotImageUrl = (s: HeroSlot): string | null => {
    if (s.media_type !== 'image') return null;
    if (s.image_storage_path) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base) return null;
      return `${base.replace(/\/$/, '')}/storage/v1/object/public/media/${String(s.image_storage_path).replace(/^\/+/, '')}`;
    }
    return s.image_url ?? null;
  };
  const resolveSlotEmbedDisplay = (s: HeroSlot): string | null => {
    if (s.media_type !== 'embed') return null;
    return s.embed_url ?? (s.embed_provider && s.embed_id ? `${s.embed_provider}: ${s.embed_id}` : null) ?? null;
  };

  const resolveSlotVideoUrl = (s: HeroSlot): string | null => {
    if (s.media_type !== 'video') return null;
    if (s.video_storage_path) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base) return null;
      return `${base.replace(/\/$/, '')}/storage/v1/object/public/media/${String(s.video_storage_path).replace(/^\/+/, '')}`;
    }
    return null;
  };
  const resolveSlotPosterUrl = (s: HeroSlot): string | null => {
    if (!s.poster_storage_path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/media/${String(s.poster_storage_path).replace(/^\/+/, '')}`;
  };

  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [slotUploading, setSlotUploading] = useState<{ slot: number; kind: 'image' | 'video' | 'poster' } | null>(null);
  const slotVideoInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slotPosterInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slotImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <div className="mb-6 space-y-4">
      <h3 className="text-sm font-medium text-slate-700">Carousel (3 slots) — 7s rotation, film flare</h3>
      <p className="text-xs text-slate-500 mb-3">If all slots are empty, the single hero below is used. Reorder with Up/Down.</p>
      {[0, 1, 2].map((index) => {
        const s = slots[index]!;
        const imgUrl = resolveSlotImageUrl(s);
        const videoUrl = resolveSlotVideoUrl(s);
        const posterUrl = resolveSlotPosterUrl(s);
        const isUploading = slotUploading?.slot === index;
        return (
          <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Slot {index + 1}</span>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => setSlot(index, { enabled: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-600">Enabled</span>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveSlot(index, 'up')} disabled={index === 0} className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40" aria-label="Move up"><ChevronUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => moveSlot(index, 'down')} disabled={index === 2} className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40" aria-label="Move down"><ChevronDown className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name={`slot-${index}-type`} checked={s.media_type === 'image'} onChange={() => setSlot(index, { media_type: 'image', embed_provider: null, embed_id: null, embed_url: null })} />
                <span className="text-sm">Image</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name={`slot-${index}-type`} checked={s.media_type === 'video'} onChange={() => setSlot(index, { media_type: 'video', embed_provider: null, embed_id: null, embed_url: null, image_storage_path: null, image_url: null })} />
                <span className="text-sm">Video</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name={`slot-${index}-type`} checked={s.media_type === 'embed'} onChange={() => setSlot(index, { media_type: 'embed', image_storage_path: null, image_url: null, video_storage_path: null, poster_storage_path: null })} />
                <span className="text-sm">Embed</span>
              </label>
            </div>
            {s.media_type === 'image' ? (
              <div className="flex items-center gap-3 flex-wrap">
                {imgUrl ? <img src={imgUrl} alt="" className="w-20 h-14 object-cover rounded border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-20 h-14 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">No image</div>}
                <input
                  ref={(el) => { slotImageInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setSlotUploading({ slot: index, kind: 'image' });
                    try {
                      const result = await uploadSlotFile(index, 'image', file);
                      if (result) {
                        const next = slotsRef.current.map((sl, i) => i === index ? { ...sl, image_storage_path: result.storage_path, image_url: null } : sl);
                        onSlotsChange(next);
                      }
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed');
                    } finally {
                      setSlotUploading(null);
                    }
                  }}
                />
                <button type="button" onClick={() => slotImageInputRefs.current[index]?.click()} disabled={!!isUploading} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm disabled:opacity-50">Upload image</button>
                <button type="button" onClick={() => setPickerSlot(index)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm">Choose from library</button>
                {(imgUrl || s.image_storage_path || s.image_url) && (
                  <button type="button" onClick={() => setSlot(index, { image_storage_path: null, image_url: null })} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm">Clear</button>
                )}
              </div>
            ) : s.media_type === 'video' ? (
              <div className="space-y-2">
                {videoUrl && <p className="text-xs text-slate-600">Video uploaded</p>}
                {posterUrl && <img src={posterUrl} alt="Poster" className="w-20 h-14 object-cover rounded border border-slate-200" />}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={(el) => { slotVideoInputRefs.current[index] = el; }}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setSlotUploading({ slot: index, kind: 'video' });
                      try {
                        const result = await uploadSlotFile(index, 'video', file);
                        if (result) {
                          const next = slotsRef.current.map((sl, i) => i === index ? { ...sl, video_storage_path: result.storage_path } : sl);
                          onSlotsChange(next);
                        }
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Video upload failed');
                      } finally {
                        setSlotUploading(null);
                      }
                    }}
                  />
                  <input
                    ref={(el) => { slotPosterInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setSlotUploading({ slot: index, kind: 'poster' });
                      try {
                        const result = await uploadSlotFile(index, 'poster', file);
                        if (result) {
                          const next = slotsRef.current.map((sl, i) => i === index ? { ...sl, poster_storage_path: result.storage_path } : sl);
                          onSlotsChange(next);
                        }
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Poster upload failed');
                      } finally {
                        setSlotUploading(null);
                      }
                    }}
                  />
                  <button type="button" onClick={() => slotVideoInputRefs.current[index]?.click()} disabled={!!isUploading} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm disabled:opacity-50">Upload video</button>
                  <button type="button" onClick={() => slotPosterInputRefs.current[index]?.click()} disabled={!!isUploading} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm disabled:opacity-50">Upload poster</button>
                  {(videoUrl || s.video_storage_path) && (
                    <button type="button" onClick={() => setSlot(index, { video_storage_path: null, poster_storage_path: null })} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm">Clear</button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="YouTube or Vimeo URL / ID"
                  value={s.embed_url ?? s.embed_id ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const norm = normalizeHeroEmbed(v);
                    if (norm) setSlot(index, { embed_provider: norm.provider, embed_id: norm.id, embed_url: norm.embed_url });
                    else setSlot(index, { embed_provider: null, embed_id: v || null, embed_url: v || null });
                  }}
                  className="admin-input w-full max-w-md px-3 py-2 text-sm"
                />
                {resolveSlotEmbedDisplay(s) && <p className="text-xs text-slate-500 mt-1">{resolveSlotEmbedDisplay(s)}</p>}
                {(s.embed_id || s.embed_url) && !s.embed_provider && <p className="text-xs text-amber-600 mt-1">Enter a valid YouTube or Vimeo URL to save.</p>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Overlay: {Math.round((s.overlay_opacity ?? 0.4) * 100)}%</label>
              <input type="range" min="0" max="70" value={Math.round((s.overlay_opacity ?? 0.4) * 100)} onChange={(e) => setSlot(index, { overlay_opacity: Number(e.target.value) / 100 })} className="w-24" />
            </div>
          </div>
        );
      })}
      {pickerSlot !== null && (
        <MediaLibraryPicker
          open={true}
          onClose={() => setPickerSlot(null)}
          onSelect={(asset) => { setSlot(pickerSlot, { media_type: 'image', image_url: asset.preview_url, image_storage_path: null }); setPickerSlot(null); }}
          filter="image"
          title="Choose slot image"
        />
      )}
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

function slotHasContent(s: HeroSlot): boolean {
  if (!s.enabled) return false;
  if (s.media_type === 'image') return !!(s.image_storage_path || s.image_url);
  if (s.media_type === 'video') return !!s.video_storage_path;
  if (s.media_type === 'embed') return !!(s.embed_provider && s.embed_id);
  return false;
}

export function DashboardHeroEditor() {
  const [heroSections, setHeroSections] = useState<Record<string, HeroSection>>({});
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeAnyway, setPurgeAnyway] = useState(false);
  const [purging, setPurging] = useState(false);
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
    const slotsResult = normalizeHeroSlots(current.hero_slots ?? []);
    if (slotsResult && 'error' in slotsResult) {
      alert(slotsResult.error);
      return;
    }
    const normalizedSlots = Array.isArray(slotsResult) ? slotsResult : (current.hero_slots ?? null);
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
          hero_slots: normalizedSlots,
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

      {/* Hero Carousel — 3 slots (image or YouTube), 7s rotation, film flare */}
      <HeroCarouselSlotsEditor
        hero={hero}
        onSlotsChange={(slots) => updateHero({ hero_slots: slots })}
      />

      {/* Purge legacy Uploadcare hero URLs */}
      {hero && (
        <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50/50">
          <h3 className="text-sm font-medium text-slate-800 mb-1">Legacy cleanup</h3>
          <p className="text-xs text-slate-600 mb-3">
            Remove old Uploadcare/single-hero URLs so only the 3-slot carousel is used for this page.
          </p>
          <button
            type="button"
            onClick={() => { setPurgeModalOpen(true); setPurgeAnyway(false); }}
            className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-medium hover:bg-red-50"
          >
            Purge legacy Uploadcare hero URLs
          </button>
        </div>
      )}

      {purgeModalOpen && hero && (() => {
        const raw = hero.hero_slots ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        const slots: HeroSlot[] = [toHeroSlot(arr[0], 1), toHeroSlot(arr[1], 2), toHeroSlot(arr[2], 3)];
        const anySlotHasContent = slots.some(slotHasContent);
        const canPurge = anySlotHasContent || purgeAnyway;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="purge-modal-title">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h2 id="purge-modal-title" className="text-lg font-semibold text-slate-800 mb-2">Purge legacy hero URLs?</h2>
              <p className="text-sm text-slate-600 mb-4">
                This will set legacy hero URL fields (media_url, hero_logo_url, etc.) to null for this page. Only the 3-slot carousel will be used. Existing uploads in slots are not affected.
              </p>
              {!anySlotHasContent && (
                <label className="flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={purgeAnyway} onChange={(e) => setPurgeAnyway(e.target.checked)} className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">Purge anyway (all slots are empty)</span>
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPurgeModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
                <button
                  type="button"
                  disabled={!canPurge || purging}
                  onClick={async () => {
                    if (!canPurge) return;
                    setPurging(true);
                    try {
                      const res = await fetch('/api/admin/hero/purge-legacy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ page_slug: selectedPage }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || res.statusText);
                      setHeroSections((prev) => ({
                        ...prev,
                        [selectedPage]: {
                          ...prev[selectedPage],
                          media_url: null,
                          media_storage_path: null,
                          hero_logo_url: null,
                          hero_logo_storage_path: null,
                          external_media_asset_id: null,
                        } as HeroSection,
                      }));
                      setPurgeModalOpen(false);
                      const path = selectedPage === 'home' ? '/' : `/${selectedPage}`;
                      await revalidatePaths([path]);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Purge failed');
                    } finally {
                      setPurging(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {purging ? 'Purging…' : 'Purge'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
