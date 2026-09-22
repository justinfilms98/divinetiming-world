'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { revalidatePaths } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';
import { MediaLibraryPicker, type LibraryAsset } from '@/components/admin/MediaLibraryPicker';
import type {
  PressKit,
  PresskitAsset,
  PressRelease,
  PresskitPerformance,
  PresskitAssetKind,
} from '@/lib/types/content';

export default function AdminPressKitPage() {
  const [data, setData] = useState<PressKit | null>(null);
  const [assets, setAssets] = useState<PresskitAsset[]>([]);
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [performances, setPerformances] = useState<PresskitPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState<PresskitAssetKind>('photo');
  const [newRelease, setNewRelease] = useState({ title: '', body_md: '', published_at: '', external_url: '', status: 'draft' as 'draft' | 'published' });
  const [newShow, setNewShow] = useState({ label: '', venue: '', city: '', country: '', year: '' });
  const { showToast } = useAdminToast();

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/presskit', { credentials: 'same-origin' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || res.statusText);
      setData(null);
      return;
    }
    setData(json.presskit);
    setAssets(json.assets ?? []);
    setReleases(json.releases ?? []);
    setPerformances(json.performances ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        setError('Failed to load press kit');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const patchField = <K extends keyof PressKit>(key: K, value: PressKit[K]) => {
    if (!data) return;
    setData({ ...data, [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/presskit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: data.title,
          bio_text: data.long_bio || data.bio_text,
          short_bio: data.short_bio ?? '',
          long_bio: data.long_bio ?? data.bio_text,
          experience_text: data.experience_text,
          audience_text: data.audience_text ?? '',
          links_text: data.links_text ?? '',
          tech_rider_text: data.tech_rider_text ?? '',
          tech_rider_url: data.tech_rider_url ?? '',
          hospitality_rider_text: data.hospitality_rider_text ?? '',
          hospitality_rider_url: data.hospitality_rider_url ?? '',
          performance_reel_url: data.performance_reel_url ?? '',
          booking_contact_name: data.booking_contact_name ?? '',
          booking_contact_email: data.booking_contact_email ?? '',
          booking_contact_phone: data.booking_contact_phone ?? '',
          pdf_url: data.pdf_url ?? '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', (json.error as string) || res.statusText);
      } else {
        if (json.presskit) setData(json.presskit);
        await revalidatePaths(['/presskit']);
        setSaved(true);
        showToast('success', 'Press kit saved');
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const addAsset = async (asset: LibraryAsset) => {
    const res = await fetch('/api/admin/presskit/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        kind: pickerKind,
        external_media_asset_id: asset.id,
        url: asset.preview_url,
        caption: asset.name,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      showToast('error', (json.error as string) || 'Could not add asset');
      return;
    }
    showToast('success', pickerKind === 'logo' ? 'Logo added' : 'Photo added');
    await load();
  };

  const removeAsset = async (id: string) => {
    if (!window.confirm('Remove this asset from the press kit?')) return;
    const res = await fetch(`/api/admin/presskit/assets?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      showToast('error', 'Could not remove asset');
      return;
    }
    await load();
  };

  const addRelease = async () => {
    if (!newRelease.title.trim()) {
      showToast('error', 'Press release needs a title');
      return;
    }
    const res = await fetch('/api/admin/presskit/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(newRelease),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      showToast('error', (json.error as string) || 'Could not add release');
      return;
    }
    setNewRelease({ title: '', body_md: '', published_at: '', external_url: '', status: 'draft' });
    showToast('success', 'Press release added');
    await load();
  };

  const toggleRelease = async (row: PressRelease) => {
    const next = row.status === 'published' ? 'draft' : 'published';
    const res = await fetch('/api/admin/presskit/releases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id: row.id, status: next }),
    });
    if (!res.ok) {
      showToast('error', 'Could not update release');
      return;
    }
    await load();
  };

  const removeRelease = async (id: string) => {
    if (!window.confirm('Delete this press release?')) return;
    const res = await fetch(`/api/admin/presskit/releases?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      showToast('error', 'Could not delete release');
      return;
    }
    await load();
  };

  const addPerformance = async () => {
    if (!newShow.label.trim()) {
      showToast('error', 'Performance needs a label');
      return;
    }
    const res = await fetch('/api/admin/presskit/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(newShow),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      showToast('error', (json.error as string) || 'Could not add performance');
      return;
    }
    setNewShow({ label: '', venue: '', city: '', country: '', year: '' });
    showToast('success', 'Performance added');
    await load();
  };

  const removePerformance = async (id: string) => {
    if (!window.confirm('Remove this performance?')) return;
    const res = await fetch(`/api/admin/presskit/performances?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      showToast('error', 'Could not remove performance');
      return;
    }
    await load();
  };

  if (loading) {
    return (
      <AdminPage title="Press Kit" subtitle="Content shown on the public Press Kit page">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  if (error || !data) {
    return (
      <AdminPage title="Press Kit" subtitle="Content shown on the public Press Kit page">
        <div className="text-red-600">{error || 'Press kit not found'}</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Press Kit"
      subtitle="Bios, photos, riders, reel, press releases, and the one-sheet URL. Empty fields stay off the public page."
      actions={
        <Link
          href="/presskit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View public page
        </Link>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Headline</h2>
          <input
            type="text"
            value={data.title}
            onChange={(e) => patchField('title', e.target.value)}
            className="admin-input w-full px-4 py-2 text-slate-800"
            placeholder="e.g. Press kit"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Short bio</h2>
          <p className="text-xs text-slate-500 mb-3">One or two sentences for the hero. Leave blank to hide it.</p>
          <textarea
            value={data.short_bio ?? ''}
            onChange={(e) => patchField('short_bio', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[90px]"
            placeholder="Short bio for the top of the page"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Long bio</h2>
          <p className="text-xs text-slate-500 mb-3">Full press bio. Falls back to the original bio if empty.</p>
          <textarea
            value={data.long_bio ?? data.bio_text}
            onChange={(e) => patchField('long_bio', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[180px]"
            placeholder="Long-form artist bio"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Live experience</h2>
          <textarea
            value={data.experience_text}
            onChange={(e) => patchField('experience_text', e.target.value)}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[140px]"
            placeholder="What the live show is"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Performance reel</h2>
          <p className="text-xs text-slate-500 mb-3">YouTube URL. Embedded only when this is filled in.</p>
          <input
            type="url"
            value={data.performance_reel_url ?? ''}
            onChange={(e) => patchField('performance_reel_url', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800"
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Booking contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={data.booking_contact_name ?? ''}
              onChange={(e) => patchField('booking_contact_name', e.target.value || null)}
              className="admin-input w-full px-4 py-2 text-slate-800"
              placeholder="Name"
            />
            <input
              type="email"
              value={data.booking_contact_email ?? ''}
              onChange={(e) => patchField('booking_contact_email', e.target.value || null)}
              className="admin-input w-full px-4 py-2 text-slate-800"
              placeholder="Email (falls back to site settings)"
            />
            <input
              type="text"
              value={data.booking_contact_phone ?? ''}
              onChange={(e) => patchField('booking_contact_phone', e.target.value || null)}
              className="admin-input w-full px-4 py-2 text-slate-800"
              placeholder="Phone (falls back to site settings)"
            />
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Riders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 text-xs font-medium mb-1">Tech rider (text)</label>
              <textarea
                value={data.tech_rider_text ?? ''}
                onChange={(e) => patchField('tech_rider_text', e.target.value || null)}
                className="admin-input w-full px-4 py-2 text-slate-800 min-h-[100px]"
              />
              <label className="block text-slate-700 text-xs font-medium mt-3 mb-1">Tech rider file URL</label>
              <input
                type="url"
                value={data.tech_rider_url ?? ''}
                onChange={(e) => patchField('tech_rider_url', e.target.value || null)}
                className="admin-input w-full px-4 py-2 text-slate-800"
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-medium mb-1">Hospitality rider (text)</label>
              <textarea
                value={data.hospitality_rider_text ?? ''}
                onChange={(e) => patchField('hospitality_rider_text', e.target.value || null)}
                className="admin-input w-full px-4 py-2 text-slate-800 min-h-[100px]"
              />
              <label className="block text-slate-700 text-xs font-medium mt-3 mb-1">Hospitality rider file URL</label>
              <input
                type="url"
                value={data.hospitality_rider_url ?? ''}
                onChange={(e) => patchField('hospitality_rider_url', e.target.value || null)}
                className="admin-input w-full px-4 py-2 text-slate-800"
                placeholder="https://…"
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">One-sheet PDF</h2>
          <p className="text-xs text-slate-500 mb-3">URL to an existing PDF. This admin does not generate a file.</p>
          <input
            type="url"
            value={data.pdf_url ?? ''}
            onChange={(e) => patchField('pdf_url', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800"
            placeholder="https://…/divine-timing-onesheet.pdf"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Audience / extra links text</h2>
          <textarea
            value={data.audience_text ?? ''}
            onChange={(e) => patchField('audience_text', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[80px] mb-3"
            placeholder="Optional audience note"
          />
          <textarea
            value={data.links_text ?? ''}
            onChange={(e) => patchField('links_text', e.target.value || null)}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[80px]"
            placeholder="Optional extra links copy"
          />
        </AdminCard>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
          >
            {saving ? (
              <>Saving…</>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save press kit
              </>
            )}
          </button>
        </div>
      </form>

      <AdminCard className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Photos and logos</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPickerKind('photo');
                setPickerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" /> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setPickerKind('logo');
                setPickerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" /> Logo
            </button>
          </div>
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-slate-500">No press assets yet. Pick from the media library.</p>
        ) : (
          <ul className="space-y-2">
            {assets.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm text-slate-800">{asset.caption || asset.url || asset.external_media_asset_id}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{asset.kind}</p>
                </div>
                <button type="button" onClick={() => removeAsset(asset.id)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove asset">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard className="mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Notable performances</h2>
        <p className="text-xs text-slate-500 mb-4">Editable list. Prefer this over pulling the test events table.</p>
        <ul className="space-y-2 mb-4">
          {performances.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
              <p className="text-sm text-slate-800">
                {[row.year, row.label, row.venue, row.city, row.country].filter(Boolean).join(' · ')}
              </p>
              <button type="button" onClick={() => removePerformance(row.id)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Remove performance">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input className="admin-input px-3 py-2 text-sm" placeholder="Label" value={newShow.label} onChange={(e) => setNewShow({ ...newShow, label: e.target.value })} />
          <input className="admin-input px-3 py-2 text-sm" placeholder="Venue" value={newShow.venue} onChange={(e) => setNewShow({ ...newShow, venue: e.target.value })} />
          <input className="admin-input px-3 py-2 text-sm" placeholder="City" value={newShow.city} onChange={(e) => setNewShow({ ...newShow, city: e.target.value })} />
          <input className="admin-input px-3 py-2 text-sm" placeholder="Country" value={newShow.country} onChange={(e) => setNewShow({ ...newShow, country: e.target.value })} />
          <input className="admin-input px-3 py-2 text-sm" placeholder="Year" value={newShow.year} onChange={(e) => setNewShow({ ...newShow, year: e.target.value })} />
        </div>
        <button
          type="button"
          onClick={addPerformance}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm"
        >
          <Plus className="w-4 h-4" /> Add performance
        </button>
      </AdminCard>

      <AdminCard className="mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Press releases</h2>
        <ul className="space-y-2 mb-4">
          {releases.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm text-slate-800">{row.title}</p>
                <p className="text-xs text-slate-500">
                  {row.status === 'published' ? 'Published' : 'Draft'}
                  {row.published_at ? ` · ${row.published_at}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleRelease(row)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  {row.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => removeRelease(row.id)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Delete release">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <input className="admin-input w-full px-3 py-2 text-sm" placeholder="Title" value={newRelease.title} onChange={(e) => setNewRelease({ ...newRelease, title: e.target.value })} />
          <textarea className="admin-input w-full px-3 py-2 text-sm min-h-[80px]" placeholder="Body" value={newRelease.body_md} onChange={(e) => setNewRelease({ ...newRelease, body_md: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" className="admin-input px-3 py-2 text-sm" value={newRelease.published_at} onChange={(e) => setNewRelease({ ...newRelease, published_at: e.target.value })} />
            <input className="admin-input px-3 py-2 text-sm" placeholder="External URL" value={newRelease.external_url} onChange={(e) => setNewRelease({ ...newRelease, external_url: e.target.value })} />
            <select className="admin-input px-3 py-2 text-sm" value={newRelease.status} onChange={(e) => setNewRelease({ ...newRelease, status: e.target.value as 'draft' | 'published' })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={addRelease}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm"
        >
          <Plus className="w-4 h-4" /> Add press release
        </button>
      </AdminCard>

      <MediaLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addAsset}
        filter="image"
        title={pickerKind === 'logo' ? 'Choose a logo' : 'Choose a press photo'}
      />
    </AdminPage>
  );
}
