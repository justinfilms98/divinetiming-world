'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, Upload, X, Cloud } from 'lucide-react';
import { compressMedia } from '@/lib/utils/compressMedia';
import { revalidateAfterSave } from '@/lib/revalidate';
import { GoogleDrivePicker } from '@/components/admin/GoogleDrivePicker';

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

export default function AdminHomepagePage() {
  const [hero, setHero] = useState<HeroSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadHero();
  }, []);

  const loadHero = async () => {
    const { data } = await supabase
      .from('hero_sections')
      .select('*')
      .eq('page_slug', 'home')
      .single();
    setHero(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero) return;
    setIsSaving(true);
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
        cta_text: hero.cta_text,
        cta_url: hero.cta_url,
        animation_type: hero.animation_type,
        animation_enabled: hero.animation_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hero.id);

    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      await revalidateAfterSave('home');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setIsSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hero) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Please upload an image or video file.');
      return;
    }

    const newMediaType = isImage ? 'image' : 'video';
    setHero({ ...hero, media_type: newMediaType });
    setUploading(true);
    setUploadProgress(0);

    try {
      const compressedFile = await compressMedia(file, (p) => setUploadProgress(Math.floor(p * 0.8)));
      const fileExt = compressedFile.name.split('.').pop() || file.name.split('.').pop();
      const filePath = `hero-media/home-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage.from('media').upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      setHero({ ...hero, media_url: urlData.publicUrl, media_type: newMediaType });
      setUploadProgress(100);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Homepage" description="Edit homepage hero and content" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!hero) {
    return (
      <div>
        <PageHeader title="Homepage" description="Edit homepage hero and content" />
        <div className="text-white/60">Hero section not found. Run migrations.</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Homepage Editor"
        description="Visual preview — changes update instantly. Save to push live."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hero Preview */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Hero Preview</h2>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
            {(hero.media_type === 'video' && hero.media_url) ? (
              <video
                src={hero.media_url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (hero.media_type === 'image' && hero.media_url) ? (
              <img
                src={hero.media_url}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#1a0f1f]">
                <span className="text-white/30 text-lg">Default eclipse</span>
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"
              style={{ opacity: hero.overlay_opacity }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                {hero.headline || 'DIVINE:TIMING'}
              </h1>
              {hero.subtext && (
                <p className="text-white/80 mt-2">{hero.subtext}</p>
              )}
            </div>
          </div>
        </AdminCard>

        {/* Hero Options */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Hero Options</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Media Type</label>
              <select
                value={hero.media_type}
                onChange={(e) => setHero({ ...hero, media_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="default">Default (Eclipse)</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Hero Media</label>
              {hero.media_url && hero.media_type !== 'default' ? (
                <div className="space-y-3">
                  <div className="relative">
                    {hero.media_type === 'image' ? (
                      <img
                        src={hero.media_url}
                        alt="Hero"
                        className="w-full h-40 object-cover rounded-lg border border-white/10"
                      />
                    ) : (
                      <video
                        src={hero.media_url}
                        className="w-full h-40 object-cover rounded-lg border border-white/10"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setHero({ ...hero, media_url: null, media_type: 'default', external_media_asset_id: null })}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="hero-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="hero-upload"
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}
                  >
                    <Upload className="w-5 h-5" />
                    <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload File'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDrivePickerOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-white/20 rounded-lg hover:border-[var(--accent)] transition-colors"
                  >
                    <Cloud className="w-5 h-5" />
                    Select from Google Drive
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Overlay Opacity: {(hero.overlay_opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={hero.overlay_opacity}
                onChange={(e) => setHero({ ...hero, overlay_opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Headline</label>
              <input
                type="text"
                value={hero.headline || ''}
                onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="DIVINE:TIMING"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Subtext</label>
              <input
                type="text"
                value={hero.subtext || ''}
                onChange={(e) => setHero({ ...hero, subtext: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Optional tagline"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Animation</label>
              <select
                value={hero.animation_type}
                onChange={(e) => setHero({ ...hero, animation_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="warp">Warp ripple</option>
                <option value="clock">Clock sweep</option>
                <option value="none">None</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="animation_enabled"
                checked={hero.animation_enabled}
                onChange={(e) => setHero({ ...hero, animation_enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="animation_enabled" className="text-white/70 text-sm">
                Animation enabled
              </label>
            </div>
          </div>
        </AdminCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50"
          >
            {saved ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />{isSaving ? 'Saving...' : 'Save & Push Live'}</>}
          </button>
        </div>
      </form>

      <GoogleDrivePicker
        isOpen={drivePickerOpen}
        onClose={() => setDrivePickerOpen(false)}
        onSelect={(asset) => {
          setHero({
            ...hero!,
            media_url: asset.url,
            media_type: asset.mediaType,
            external_media_asset_id: asset.id,
          });
          setDrivePickerOpen(false);
        }}
        acceptedTypes={['image', 'video']}
      />
    </>
  );
}
