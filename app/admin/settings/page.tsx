'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageShell } from '@/components/layout/PageShell';
import { AdminCard } from '@/components/admin/AdminCard';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Save, Check, X } from 'lucide-react';
import { Uploader } from '@/components/admin/Uploader';
import { revalidatePaths } from '@/lib/revalidate';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    setSettings(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSaved(false);

    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        artist_name: settings.artist_name,
        member_1_name: settings.member_1_name,
        member_2_name: settings.member_2_name,
        hero_media_type: settings.hero_media_type === 'video' ? 'image' : settings.hero_media_type,
        hero_media_url: settings.hero_media_url || null,
        instagram_url: settings.instagram_url,
        youtube_url: settings.youtube_url,
        spotify_url: settings.spotify_url,
        apple_music_url: settings.apple_music_url,
        booking_phone: settings.booking_phone,
        booking_email: settings.booking_email,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert('Error saving settings: ' + (data.error || res.statusText));
    } else {
      if (data.settings) setSettings(data.settings);
      await revalidatePaths(['/', '/events', '/media', '/shop', '/booking', '/about']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setIsSaving(false);
  };

  const handleHeroMediaSelected = (assets: { preview_url: string; mime_type: string | null }[]) => {
    const asset = assets[0];
    if (!asset || !settings) return;
    const mediaType = asset.mime_type?.startsWith('video/') ? 'video' : 'image';
    setSettings({ ...settings, hero_media_url: asset.preview_url, hero_media_type: mediaType });
  };

  const handleRemoveMedia = () => {
    setSettings({ ...settings, hero_media_url: '', hero_media_type: 'default' });
  };

  if (isLoading) {
    return (
      <PageShell title="Settings" subtitle="Manage site settings and configuration">
        <div className="text-white/60">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Settings"
      subtitle="Manage your site settings, branding, and integrations"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Artist Name</label>
              <input
                type="text"
                value={settings?.artist_name || ''}
                onChange={(e) => setSettings({ ...settings, artist_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Member 1 Name</label>
                <input
                  type="text"
                  value={settings?.member_1_name || ''}
                  onChange={(e) => setSettings({ ...settings, member_1_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Member 2 Name</label>
                <input
                  type="text"
                  value={settings?.member_2_name || ''}
                  onChange={(e) => setSettings({ ...settings, member_2_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Hero Media */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Hero Media</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Hero Media Type</label>
              <select
                value={settings?.hero_media_type === 'video' ? 'image' : (settings?.hero_media_type || 'default')}
                onChange={(e) => setSettings({ ...settings, hero_media_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="default">Default (Eclipse Image)</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Hero Media</label>
              {settings?.hero_media_url && settings?.hero_media_type !== 'default' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={settings.hero_media_url}
                      alt="Hero preview"
                      className="w-full h-48 object-cover rounded-lg border border-white/10"
                    />
                    {settings.hero_media_type === 'video' && (
                      <p className="text-white/50 text-xs mt-1">Stored as video; displayed as image. Use per-page hero for video.</p>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white/50 text-xs">
                    Current: Image
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Uploader
                    acceptedTypes={['image']}
                    onSelected={handleHeroMediaSelected}
                    buttonLabel="Upload Image"
                  />
                  <p className="text-white/50 text-xs">
                    Uses Uploadcare. Leave empty to use default eclipse image.
                  </p>
                </div>
              )}
            </div>
          </div>
        </AdminCard>

        {/* Social Links */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Instagram URL</label>
              <input
                type="url"
                value={settings?.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">YouTube URL</label>
              <input
                type="url"
                value={settings?.youtube_url || ''}
                onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Spotify URL</label>
              <input
                type="url"
                value={settings?.spotify_url || ''}
                onChange={(e) => setSettings({ ...settings, spotify_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Apple Music URL</label>
              <input
                type="url"
                value={settings?.apple_music_url || ''}
                onChange={(e) => setSettings({ ...settings, apple_music_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </AdminCard>

        {/* Booking */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Booking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Booking Phone</label>
              <input
                type="tel"
                value={settings?.booking_phone || ''}
                onChange={(e) => setSettings({ ...settings, booking_phone: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Booking Email</label>
              <input
                type="email"
                value={settings?.booking_email || ''}
                onChange={(e) => setSettings({ ...settings, booking_email: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </AdminCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <LuxuryButton
            type="submit"
            disabled={isSaving}
            loading={isSaving && !saved}
            className="flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </LuxuryButton>
        </div>
      </form>
    </PageShell>
  );
}
