'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import { isContentInboxEnabled } from '@/lib/features';
import { RefreshCw, Youtube, Unplug, Instagram } from 'lucide-react';
import Link from 'next/link';

interface YouTubeAccount {
  id: string;
  external_account_id: string | null;
  display_name: string | null;
  status: 'connected' | 'needs_reconnect' | 'disconnected' | 'error';
  last_sync_at: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  connected: { label: 'Connected', className: 'bg-emerald-500/20 text-emerald-300' },
  needs_reconnect: { label: 'Needs reconnect', className: 'bg-amber-500/20 text-amber-300' },
  disconnected: { label: 'Disconnected', className: 'bg-slate-500/20 text-slate-300' },
  error: { label: 'Error', className: 'bg-red-500/20 text-red-300' },
};

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30';

export default function AdminIntegrationsPage() {
  const enabled = isContentInboxEnabled();
  const { showToast } = useAdminToast();

  const [configured, setConfigured] = useState(false);
  const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/youtube', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setConfigured(!!data.configured);
      setAccounts((data.accounts as YouTubeAccount[]) ?? []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel.trim()) return;
    setConnecting(true);
    try {
      const res = await fetch('/api/admin/integrations/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ channel: channel.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Connect failed');
      setChannel('');
      showToast('success', `Connected ${data.account?.title || 'channel'}`);
      await load();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Connect failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch('/api/admin/integrations/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ accountId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Sync failed');
      const c = data.counts || {};
      showToast('success', `Sync done — ${c.imported ?? 0} new, ${c.duplicate ?? 0} existing. Review them in the Content Inbox.`);
      await load();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this channel? Future syncs stop; already-published videos stay on the site.')) return;
    const res = await fetch(`/api/admin/integrations/youtube?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast('error', (d?.error as string) || 'Disconnect failed');
      return;
    }
    showToast('success', 'Channel disconnected');
    await load();
  };

  if (!enabled) {
    return (
      <AdminPage title="Integrations" subtitle="Connect social platforms">
        <AdminCard>
          <p className="text-white/70">
            Integrations are disabled. Set{' '}
            <code className="px-1 py-0.5 rounded bg-white/10">NEXT_PUBLIC_CONTENT_INBOX_ENABLED=1</code> to enable.
          </p>
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Integrations"
      subtitle="Connect a YouTube channel and sync uploads into the Content Inbox for review. Nothing publishes automatically."
    >
      <AdminCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Youtube className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">YouTube</h2>
          <span
            className={`ml-2 px-2 py-0.5 text-xs rounded ${
              configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {configured ? 'API key configured' : 'API key missing'}
          </span>
        </div>

        {!configured && (
          <p className="text-sm text-amber-300/80 mb-4">
            Set the <code className="px-1 py-0.5 rounded bg-white/10">YOUTUBE_API_KEY</code> environment variable on the
            server to enable connecting and syncing.
          </p>
        )}

        <form onSubmit={handleConnect} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[320px] flex-1">
            <label className="block text-sm font-medium text-white/70 mb-1">Channel ID, @handle, or URL</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="UC… or @handle or https://youtube.com/@handle"
              className={inputClass}
              disabled={!configured}
            />
          </div>
          <button
            type="submit"
            disabled={connecting || !configured || !channel.trim()}
            className="px-4 py-2 rounded-lg bg-[#C6A75E] text-black font-medium hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? 'Connecting…' : 'Connect channel'}
          </button>
        </form>
      </AdminCard>

      {loading ? (
        <AdminCard>
          <p className="text-white/50 text-center py-6">Loading…</p>
        </AdminCard>
      ) : accounts.length === 0 ? (
        <AdminCard>
          <p className="text-white/50 text-center py-6">No channels connected yet.</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {accounts.map((acct) => {
            const status = STATUS_LABEL[acct.status] ?? STATUS_LABEL.error;
            return (
              <AdminCard key={acct.id} className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate">{acct.display_name || acct.external_account_id}</p>
                    <span className={`px-2 py-0.5 text-xs rounded ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-white/50">
                    {acct.last_sync_at ? `Last sync ${new Date(acct.last_sync_at).toLocaleString()}` : 'Never synced'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSync(acct.id)}
                    disabled={syncingId === acct.id || acct.status === 'disconnected'}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[#C6A75E] text-black font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingId === acct.id ? 'animate-spin' : ''}`} />
                    {syncingId === acct.id ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(acct.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-white/15 text-white/70 hover:bg-white/10"
                  >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      <AdminCard className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Instagram className="w-5 h-5 text-pink-400" />
          <h2 className="text-lg font-semibold text-white">Instagram</h2>
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-white/10 text-white/60">Manual import</span>
        </div>
        <p className="text-sm text-white/60">
          Direct API sync needs a Meta app with a Business/Creator account and will be added later. For now, paste a
          post or reel URL into the{' '}
          <Link href="/admin/inbox" className="text-[#C6A75E] hover:underline">
            Content Inbox
          </Link>{' '}
          — it&apos;s detected as Instagram and deduplicated by its shortcode.
        </p>
      </AdminCard>
    </AdminPage>
  );
}
