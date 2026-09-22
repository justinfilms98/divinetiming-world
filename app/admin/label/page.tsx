'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import type { LabelArtist, LabelRelease, LabelSettings } from '@/lib/types/label';

export default function AdminLabelPage() {
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [publicFlag, setPublicFlag] = useState(false);
  const [settings, setSettings] = useState<LabelSettings | null>(null);
  const [artists, setArtists] = useState<LabelArtist[]>([]);
  const [releases, setReleases] = useState<LabelRelease[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/label', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setSettings((data.settings as LabelSettings | null) ?? null);
      setArtists((data.artists as LabelArtist[]) ?? []);
      setReleases((data.releases as LabelRelease[]) ?? []);
      setPublicFlag(!!data.publicFlag);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load');
      setArtists([]);
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminPage
      title="Label"
      subtitle="Internal scaffold. The public site stays dark until a launch flag and a published setting are both on."
    >
      <AdminCard>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
          Public presence
        </h2>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">
          Public <code className="px-1 py-0.5 rounded bg-white/10">/label</code> 404s unless{' '}
          <code className="px-1 py-0.5 rounded bg-white/10">NEXT_PUBLIC_LABEL_PUBLIC_ENABLED=1</code>.
          Even then it is a coming-soon note, not a label homepage. Roster rows stay hidden from
          the public API until they are published and{' '}
          <code className="px-1 py-0.5 rounded bg-white/10">label_settings.public_enabled</code> is
          true.
        </p>
        <dl className="mt-4 grid gap-2 text-sm text-white/70">
          <div className="flex gap-2">
            <dt className="text-white/40">Feature flag</dt>
            <dd>{publicFlag ? 'on' : 'off (default)'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-white/40">Published setting</dt>
            <dd>{settings?.public_enabled ? 'on' : 'off (default)'}</dd>
          </div>
        </dl>
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Roster</h2>
        {loading ? (
          <p className="mt-3 text-sm text-white/50">Loading…</p>
        ) : artists.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No artists yet. Roster management comes when the label is ready to operate.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            {artists.map((artist) => (
              <li key={artist.id}>
                {artist.name}{' '}
                <span className="text-white/40">({artist.status})</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
          Releases
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-white/50">Loading…</p>
        ) : releases.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No label releases yet. Catalogue pages and submissions are deferred until launch.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            {releases.map((release) => (
              <li key={release.id}>
                {release.title}{' '}
                <span className="text-white/40">({release.status})</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
