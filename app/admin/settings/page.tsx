'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check } from 'lucide-react';
import { revalidatePaths } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    setSettings(data as Record<string, unknown>);
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
      showToast('error', data.error || res.statusText);
    } else {
      if (data.settings) setSettings(data.settings);
      await revalidatePaths(['/', '/events', '/media', '/shop', '/booking', '/about']);
      setSaved(true);
      showToast('success', 'Settings saved');
      setTimeout(() => setSaved(false), 3000);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminPage title="Settings" subtitle="Core site settings">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Settings"
      subtitle="Site settings and integrations"
    >
      <form onSubmit={handleSave} className="space-y-6">
        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Artist Name</label>
              <input
                type="text"
                value={(settings?.artist_name as string) || ''}
                onChange={(e) => setSettings({ ...settings, artist_name: e.target.value })}
                className="admin-input w-full px-4 py-2 text-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Member 1 Name</label>
                <input
                  type="text"
                  value={(settings?.member_1_name as string) || ''}
                  onChange={(e) => setSettings({ ...settings, member_1_name: e.target.value })}
                  className="admin-input w-full px-4 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Member 2 Name</label>
                <input
                  type="text"
                  value={(settings?.member_2_name as string) || ''}
                  onChange={(e) => setSettings({ ...settings, member_2_name: e.target.value })}
                  className="admin-input w-full px-4 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Social Links</h2>
          <div className="space-y-4">
            {[
              { key: 'instagram_url', label: 'Instagram URL' },
              { key: 'youtube_url', label: 'YouTube URL' },
              { key: 'spotify_url', label: 'Spotify URL' },
              { key: 'apple_music_url', label: 'Apple Music URL' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-slate-700 text-sm font-medium mb-2">{label}</label>
                <input
                  type="url"
                  value={(settings?.[key] as string) || ''}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="admin-input w-full px-4 py-2 text-slate-800"
                />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Booking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Booking Phone</label>
              <input
                type="tel"
                value={(settings?.booking_phone as string) || ''}
                onChange={(e) => setSettings({ ...settings, booking_phone: e.target.value })}
                className="admin-input w-full px-4 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Booking Email</label>
              <input
                type="email"
                value={(settings?.booking_email as string) || ''}
                onChange={(e) => setSettings({ ...settings, booking_email: e.target.value })}
                className="admin-input w-full px-4 py-2 text-slate-800"
              />
            </div>
          </div>
        </AdminCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="admin-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
