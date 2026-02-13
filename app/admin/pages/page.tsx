'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, ChevronRight, Upload, X, Cloud } from 'lucide-react';
import { GoogleDrivePicker } from '@/components/admin/GoogleDrivePicker';
import { compressMedia } from '@/lib/utils/compressMedia';
import { revalidatePaths } from '@/lib/revalidate';
import Link from 'next/link';

const PAGE_SLUGS = ['home', 'events', 'media', 'shop', 'booking', 'about'] as const;
const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  events: 'Events',
  media: 'Media',
  shop: 'Shop',
  booking: 'Booking',
  about: 'About',
};

interface PageSettings {
  id: string;
  page_slug: string;
  seo_title: string | null;
  seo_description: string | null;
}

interface HeroSection {
  id: string;
  page_slug: string;
  media_type: string;
  media_url: string | null;
  external_media_asset_id?: string | null;
  overlay_opacity: number;
  headline: string | null;
  subtext: string | null;
  cta_text: string | null;
  cta_url: string | null;
  animation_type: string;
  animation_enabled: boolean;
}

export default function AdminPagesPage() {
  const [pageSettings, setPageSettings] = useState<Record<string, PageSettings>>({});
  const [heroSections, setHeroSections] = useState<Record<string, HeroSection>>({});
  const [expandedPage, setExpandedPage] = useState<string | null>('home');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [drivePickerPage, setDrivePickerPage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [psRes, heroRes] = await Promise.all([
      supabase.from('page_settings').select('*'),
      supabase.from('hero_sections').select('*'),
    ]);

    const psMap: Record<string, PageSettings> = {};
    (psRes.data || []).forEach((p: PageSettings) => {
      psMap[p.page_slug] = p;
    });
    setPageSettings(psMap);

    const heroMap: Record<string, HeroSection> = {};
    (heroRes.data || []).forEach((h: HeroSection) => {
      heroMap[h.page_slug] = h;
    });
    setHeroSections(heroMap);
  };

  const handleSavePage = async (pageSlug: string) => {
    setSaving(pageSlug);
    setSaved(null);

    const ps = pageSettings[pageSlug];
    const hero = heroSections[pageSlug];
    if (!ps || !hero) {
      setSaving(null);
      return;
    }

    const [psError, heroError] = await Promise.all([
      supabase
        .from('page_settings')
        .update({
          seo_title: ps.seo_title,
          seo_description: ps.seo_description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ps.id)
        .then((r) => r.error),
      supabase
        .from('hero_sections')
        .update({
          media_type: hero.media_type,
          media_url: hero.media_url,
          external_media_asset_id: hero.external_media_asset_id ?? null,
          overlay_opacity: hero.overlay_opacity,
          headline: hero.headline,
          subtext: hero.subtext,
          cta_text: hero.cta_text,
          cta_url: hero.cta_url,
          animation_type: hero.animation_type,
          animation_enabled: hero.animation_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hero.id)
        .then((r) => r.error),
    ]);

    if (psError || heroError) {
      alert('Error saving: ' + (psError?.message || heroError?.message));
    } else {
      const paths = pageSlug === 'home' ? ['/'] : [`/${pageSlug}`];
      await revalidatePaths(paths);
      setSaved(pageSlug);
      setTimeout(() => setSaved(null), 3000);
    }
    setSaving(null);
  };

  const handleDriveSelect = (asset: { id: string; url: string; mediaType: 'image' | 'video' }) => {
    if (!drivePickerPage) return;
    setHeroSections((prev) => ({
      ...prev,
      [drivePickerPage]: {
        ...prev[drivePickerPage],
        media_url: asset.url,
        media_type: asset.mediaType,
        external_media_asset_id: asset.id,
      },
    }));
    setDrivePickerPage(null);
  };

  const handleFileUpload = async (pageSlug: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const hero = heroSections[pageSlug];
    if (!file || !hero) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Please upload an image or video.');
      return;
    }

    setUploading(pageSlug);
    try {
      const compressed = await compressMedia(file);
      const ext = compressed.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
      const path = `hero-media/${pageSlug}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('media').upload(path, compressed, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      setHeroSections((prev) => ({
        ...prev,
        [pageSlug]: {
          ...prev[pageSlug],
          media_url: urlData.publicUrl,
          media_type: isImage ? 'image' : 'video',
          external_media_asset_id: null,
        },
      }));
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(null);
      const input = fileInputRefs.current[pageSlug];
      if (input) input.value = '';
    }
  };

  return (
    <>
      <PageHeader
        title="Page Settings"
        description="SEO and hero settings for each page"
        actions={
          <Link
            href="/admin/homepage"
            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            Full Home Hero Editor →
          </Link>
        }
      />

      <div className="space-y-2">
        {PAGE_SLUGS.map((pageSlug) => {
          const ps = pageSettings[pageSlug];
          const hero = heroSections[pageSlug];
          const isExpanded = expandedPage === pageSlug;

          if (!ps || !hero) {
            return (
              <AdminCard key={pageSlug}>
                <div className="text-white/60">Loading {PAGE_LABELS[pageSlug]}...</div>
              </AdminCard>
            );
          }

          return (
            <AdminCard key={pageSlug} className="p-0 overflow-hidden">
              <button
                onClick={() => setExpandedPage(isExpanded ? null : pageSlug)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                  <span className="font-semibold text-white">{PAGE_LABELS[pageSlug]}</span>
                  <span className="text-white/50 text-sm">/ {pageSlug}</span>
                </div>
                {pageSlug === 'home' && (
                  <Link
                    href="/admin/homepage"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--accent)] text-sm hover:underline"
                  >
                    Hero preview
                  </Link>
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-6 bg-black/20">
                  {/* SEO */}
                  <div>
                    <h3 className="text-sm font-medium text-white/80 mb-3">SEO</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">Title</label>
                        <input
                          type="text"
                          value={ps.seo_title || ''}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], seo_title: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          placeholder="Page title for search engines"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">Description</label>
                        <textarea
                          value={ps.seo_description || ''}
                          onChange={(e) =>
                            setPageSettings((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], seo_description: e.target.value },
                            }))
                          }
                          rows={2}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none"
                          placeholder="Meta description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero */}
                  <div>
                    <h3 className="text-sm font-medium text-white/80 mb-3">Hero</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">Media Type</label>
                        <select
                          value={hero.media_type}
                          onChange={(e) =>
                            setHeroSections((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], media_type: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="default">Default</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs mb-1">Hero Media</label>
                        {hero.media_url && hero.media_type !== 'default' ? (
                          <div className="relative inline-block">
                            {hero.media_type === 'image' ? (
                              <img
                                src={hero.media_url}
                                alt=""
                                className="w-32 h-20 object-cover rounded-lg border border-white/10"
                              />
                            ) : (
                              <video
                                src={hero.media_url}
                                className="w-32 h-20 object-cover rounded-lg border border-white/10"
                                muted
                                playsInline
                              />
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setHeroSections((prev) => ({
                                  ...prev,
                                  [pageSlug]: {
                                    ...prev[pageSlug],
                                    media_url: null,
                                    media_type: 'default',
                                    external_media_asset_id: null,
                                  },
                                }))
                              }
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <input
                              ref={(el) => {
                                fileInputRefs.current[pageSlug] = el;
                              }}
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleFileUpload(pageSlug, e)}
                              className="hidden"
                              id={`hero-upload-${pageSlug}`}
                              disabled={!!uploading}
                            />
                            <label
                              htmlFor={`hero-upload-${pageSlug}`}
                              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer text-sm ${uploading === pageSlug ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}
                            >
                              <Upload className="w-4 h-4" />
                              {uploading === pageSlug ? 'Uploading...' : 'Upload'}
                            </label>
                            <button
                              type="button"
                              onClick={() => setDrivePickerPage(pageSlug)}
                              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg text-sm hover:border-[var(--accent)]"
                            >
                              <Cloud className="w-4 h-4" />
                              Select from Drive
                            </button>
                          </div>
                        )}
                      </div>

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
                          onChange={(e) =>
                            setHeroSections((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], overlay_opacity: parseFloat(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/60 text-xs mb-1">Headline</label>
                          <input
                            type="text"
                            value={hero.headline || ''}
                            onChange={(e) =>
                              setHeroSections((prev) => ({
                                ...prev,
                                [pageSlug]: { ...prev[pageSlug], headline: e.target.value },
                              }))
                            }
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-white/60 text-xs mb-1">Subtext</label>
                          <input
                            type="text"
                            value={hero.subtext || ''}
                            onChange={(e) =>
                              setHeroSections((prev) => ({
                                ...prev,
                                [pageSlug]: { ...prev[pageSlug], subtext: e.target.value },
                              }))
                            }
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs mb-1">Animation</label>
                        <select
                          value={hero.animation_type}
                          onChange={(e) =>
                            setHeroSections((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], animation_type: e.target.value },
                            }))
                          }
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
                          onChange={(e) =>
                            setHeroSections((prev) => ({
                              ...prev,
                              [pageSlug]: { ...prev[pageSlug], animation_enabled: e.target.checked },
                            }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-white/70 text-sm">Animation enabled</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSavePage(pageSlug)}
                      disabled={saving === pageSlug}
                      className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50 text-sm"
                    >
                      {saved === pageSlug ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {saving === pageSlug ? 'Saving...' : 'Save'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </AdminCard>
          );
        })}
      </div>

      <GoogleDrivePicker
        isOpen={!!drivePickerPage}
        onClose={() => setDrivePickerPage(null)}
        onSelect={handleDriveSelect}
        acceptedTypes={['image', 'video']}
      />
    </>
  );
}
