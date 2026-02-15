'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, ChevronRight, X } from 'lucide-react';
import { UniversalUploader } from '@/components/admin/UniversalUploader';
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

  const handleMediaSelected = (pageSlug: string) => (assets: { id: string; preview_url: string; mime_type: string | null }[]) => {
    const asset = assets[0];
    if (!asset) return;
    const hero = heroSections[pageSlug];
    if (!hero) return;
    const mediaType = asset.mime_type?.startsWith('video/') ? 'video' : 'image';
    setHeroSections((prev) => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        media_url: asset.preview_url,
        media_type: mediaType,
        external_media_asset_id: asset.id,
      },
    }));
  };

  return (
    <>
      <PageHeader
        title="Page Settings"
        description="SEO and hero settings for each page"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/heroes"
              className="px-4 py-2 bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/30 transition-colors text-sm font-medium"
            >
              Hero Manager →
            </Link>
            <Link
              href="/admin/homepage"
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Full Home Hero Editor
            </Link>
          </div>
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
                          <UniversalUploader
                            acceptedTypes={['image', 'video']}
                            onSelected={handleMediaSelected(pageSlug)}
                            className="text-sm"
                          />
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
    </>
  );
}
