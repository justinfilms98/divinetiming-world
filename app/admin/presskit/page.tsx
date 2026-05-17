'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, ExternalLink } from 'lucide-react';
import { revalidatePaths } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';

interface PressKitRow {
  id: string;
  title: string;
  bio_text: string;
  experience_text: string;
  audience_text: string | null;
  links_text: string | null;
  tech_rider_text: string | null;
  pdf_url: string | null;
}

export default function AdminPressKitPage() {
  const [data, setData] = useState<PressKitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useAdminToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/presskit', { credentials: 'same-origin' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err?.error || res.statusText);
          setData(null);
        } else {
          const json = await res.json();
          setData(json);
          setError(null);
        }
      } catch (e) {
        setError('Failed to load press kit');
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          bio_text: data.bio_text,
          experience_text: data.experience_text,
          audience_text: data.audience_text ?? '',
          links_text: data.links_text ?? '',
          tech_rider_text: data.tech_rider_text ?? '',
          pdf_url: data.pdf_url ?? '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', (json.error as string) || res.statusText);
      } else {
        if (json.title !== undefined) setData({ ...data, ...json });
        await revalidatePaths(['/presskit']);
        setSaved(true);
        showToast('success', 'Press kit saved');
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
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
      subtitle="Edit bio, experience, audience, links, tech rider, and PDF. Content is shown on the public Press Kit page."
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
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="admin-input w-full px-4 py-2 text-slate-800"
            placeholder="e.g. PRESS KIT"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Bio</h2>
          <textarea
            value={data.bio_text}
            onChange={(e) => setData({ ...data, bio_text: e.target.value })}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[160px]"
            placeholder="Artist bio (plain text)"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Experience</h2>
          <textarea
            value={data.experience_text}
            onChange={(e) => setData({ ...data, experience_text: e.target.value })}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[160px]"
            placeholder="Performance and touring experience"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Audience</h2>
          <textarea
            value={data.audience_text ?? ''}
            onChange={(e) => setData({ ...data, audience_text: e.target.value || null })}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[100px]"
            placeholder="Optional: audience description"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Links (text)</h2>
          <textarea
            value={data.links_text ?? ''}
            onChange={(e) => setData({ ...data, links_text: e.target.value || null })}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[80px]"
            placeholder="Optional: links section text"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Tech Rider</h2>
          <textarea
            value={data.tech_rider_text ?? ''}
            onChange={(e) => setData({ ...data, tech_rider_text: e.target.value || null })}
            className="admin-input w-full px-4 py-2 text-slate-800 min-h-[120px]"
            placeholder="Optional: tech rider text"
          />
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">PDF URL</h2>
          <input
            type="url"
            value={data.pdf_url ?? ''}
            onChange={(e) => setData({ ...data, pdf_url: e.target.value || null })}
            className="admin-input w-full px-4 py-2 text-slate-800"
            placeholder="https://… (Download PDF Press Kit link)"
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
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
