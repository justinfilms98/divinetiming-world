'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { createClient } from '@/lib/supabase/client';

interface VideoRow {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  display_order: number;
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
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('videos')
      .select('id, title, youtube_id, thumbnail_url, display_order')
      .order('display_order', { ascending: true });
    setVideos((data || []) as VideoRow[]);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const youtube_id = parseYoutubeId(youtubeInput);
    if (!title.trim() || !youtube_id) {
      alert('Title and YouTube URL or video ID required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), youtube_id }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTitle('');
      setYoutubeInput('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add video');
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
      alert(d.error || 'Delete failed');
      return;
    }
    await load();
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
          <AdminCard key={v.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                alt=""
                className="w-24 h-14 object-cover rounded-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{v.title}</p>
                <p className="text-sm text-slate-500">ID: {v.youtube_id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(v.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete"
            >
              Delete
            </button>
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
