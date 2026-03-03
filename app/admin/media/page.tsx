'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { Image as ImageIcon, Video, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

type LibraryFilter = 'all' | 'image' | 'video';

interface LibraryAsset {
  id: string;
  preview_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  name: string | null;
  size_bytes: number | null;
  created_at?: string;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const supabase = createClient();

  const loadLibrary = useCallback(async () => {
    const { data } = await supabase
      .from('external_media_assets')
      .select('id, preview_url, thumbnail_url, mime_type, name, size_bytes, created_at')
      .order('created_at', { ascending: false });
    setAssets((data || []) as LibraryAsset[]);
  }, [supabase]);

  const displayUrl = (asset: LibraryAsset) =>
    asset.preview_url || asset.thumbnail_url || '';

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleUpload = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    await loadLibrary();
  };

  const filtered = assets.filter((a) => {
    if (filter === 'image' && !(a.mime_type || '').startsWith('image/')) return false;
    if (filter === 'video' && !(a.mime_type || '').startsWith('video/')) return false;
    return true;
  });

  const handleCopyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from the library?')) return;
    const res = await fetch(`/api/admin/media-library?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AdminPage
      title="Media"
      subtitle="Upload and manage media library"
      actions={
        <UniversalUploader
          multiple
          onSelected={handleUpload}
          buttonLabel="Upload"
          className="inline-flex"
        />
      }
    >
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="text-sm font-medium text-slate-600">Filter:</span>
        {(['all', 'image', 'video'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12 text-slate-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No media yet</p>
            <p className="text-sm mt-1">Use the Upload button above to add files.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((asset) => {
            const isImage = (asset.mime_type || '').startsWith('image/');
            const thumb = asset.thumbnail_url || asset.preview_url || displayUrl(asset);
            return (
              <AdminCard key={asset.id} className="p-0 overflow-hidden">
                <div className="aspect-square relative bg-slate-100">
                  {thumb ? (
                    isImage ? (
                      <>
                        <img
                          src={thumb}
                          alt={asset.name || ''}
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.style.display = 'none';
                            const fb = t.parentElement?.querySelector('.media-card-fallback');
                            if (fb) (fb as HTMLElement).classList.remove('hidden');
                          }}
                        />
                        <div className="media-card-fallback absolute inset-0 hidden flex items-center justify-center bg-slate-100">
                          <ImageIcon className="w-10 h-10 text-slate-400" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-10 h-10 text-slate-400" />
                      </div>
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium text-slate-800 truncate" title={asset.name || ''}>
                    {asset.name || 'Untitled'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isImage ? 'Image' : 'Video'} · {formatDate(asset.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 p-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(displayUrl(asset) || asset.preview_url, asset.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
                  >
                    {copiedId === asset.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === asset.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    className="p-1.5 rounded text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      <details
        className="mt-8 admin-card overflow-hidden"
        open={legacyOpen}
        onToggle={(e) => setLegacyOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50">
          {legacyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Advanced / Legacy (asset IDs, external references)
        </summary>
        <div className="px-4 pb-4 pt-0 border-t border-slate-200 text-sm text-slate-500">
          <p className="mb-3">External asset IDs are used internally for hero, gallery covers, and product images. For normal workflow, use Upload and the cards above.</p>
          {filtered.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Preview URL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs truncate max-w-[200px]" title={a.id}>{a.id}</td>
                    <td className="truncate max-w-[240px] text-slate-500" title={displayUrl(a) || ''}>{displayUrl(a) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filtered.length > 20 && <p className="mt-2 text-xs text-slate-400">Showing first 20 of {filtered.length}.</p>}
        </div>
      </details>
    </AdminPage>
  );
}
