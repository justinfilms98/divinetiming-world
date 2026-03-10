'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { useAdminToast } from '@/components/admin/AdminToast';
import { createClient } from '@/lib/supabase/client';

type VideoStatus = 'draft' | 'published' | 'archived';

interface VideoRow {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  caption?: string | null;
  is_vertical?: boolean;
  display_order: number;
  status?: VideoStatus;
}

const YOUTUBE_ID_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)?([a-zA-Z0-9_-]{11})$/;

function parseYoutubeId(input: string): string {
  const t = input.trim();
  if (t.length === 11 && /^[a-zA-Z0-9_-]+$/.test(t)) return t;
  const m = t.match(YOUTUBE_ID_REGEX);
  return m ? m[1]! : t;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [title, setTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [caption, setCaption] = useState('');
  const [isVertical, setIsVertical] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      setVideos([]);
      return;
    }
    const rows = (data || []) as Record<string, unknown>[];
    setVideos(rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      youtube_id: r.youtube_id as string,
      thumbnail_url: (r.thumbnail_url as string | null) ?? null,
      caption: (r.caption as string | null | undefined) ?? null,
      is_vertical: (r.is_vertical as boolean | null | undefined) ?? false,
      display_order: (r.display_order as number) ?? 0,
      status: r.status as VideoRow['status'],
    })));
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const youtube_id = parseYoutubeId(youtubeInput);
    if (!title.trim() || !youtube_id) {
      showToast('error', 'Title and YouTube URL or video ID required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          youtube_id,
          caption: caption.trim() || null,
          is_vertical: isVertical,
        }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTitle('');
      setYoutubeInput('');
      setCaption('');
      setIsVertical(false);
      await load();
      showToast('success', 'Video added');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this video from the Media page?')) return;
    const res = await fetch(`/api/admin/videos?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const d = await res.json();
      showToast('error', (d.error as string) || 'Delete failed');
      return;
    }
    await load();
    showToast('success', 'Video removed');
  };

  const handleStatusChange = async (id: string, status: VideoStatus) => {
    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const d = await res.json();
      showToast('error', (d.error as string) || 'Update failed');
      return;
    }
    await load();
    showToast('success', 'Video updated');
  };

  return (
    <AdminPage title="Videos" subtitle="Videos shown on the public Media page (Videos tab). Use unlisted YouTube links.">
      <AdminCard className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="min-w-[280px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">YouTube URL or video ID</label>
            <input
              type="text"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short caption"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isVertical}
              onChange={(e) => setIsVertical(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Vertical / short-form (9:16)</span>
          </label>
          <button
            type="submit"
            disabled={loading || !title.trim() || !youtubeInput.trim()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add video'}
          </button>
        </form>
      </AdminCard>

      <div className="space-y-3">
        {videos.map((v) => (
          <AdminCard key={v.id} className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                alt=""
                className="w-24 h-14 object-cover rounded-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 truncate">{v.title}</p>
                  {(v.status && v.status !== 'published') && (
                    <span className={`px-2 py-0.5 text-xs rounded ${v.status === 'draft' ? 'bg-amber-500/20 text-amber-700' : 'bg-slate-500/20 text-slate-600'}`}>
                      {v.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">ID: {v.youtube_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={v.status ?? 'published'}
                onChange={(e) => handleStatusChange(v.id, e.target.value as VideoStatus)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm bg-white"
                title="Visibility"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </AdminCard>
        ))}
      </div>
      {videos.length === 0 && (
        <AdminCard>
          <p className="text-slate-500 text-center py-6">No videos yet. Add one above.</p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
