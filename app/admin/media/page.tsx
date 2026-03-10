'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { Image as ImageIcon, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';

type LibraryFilter = 'all' | 'image' | 'video';
type SortOrder = 'newest' | 'oldest' | 'name';

interface LibraryAsset {
  id: string;
  provider?: string | null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyDetailsOpen, setLegacyDetailsOpen] = useState(false);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  const loadLibrary = useCallback(async () => {
    const { data } = await supabase
      .from('external_media_assets')
      .select('id, provider, preview_url, thumbnail_url, mime_type, name, size_bytes, created_at')
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
    // Optimistic: show newly registered assets immediately (from register response)
    const newAssets: LibraryAsset[] = files
      .filter((f): f is UploadedFile & { id: string } => typeof f.id === 'string')
      .map((f) => ({
        id: f.id,
        provider: 'supabase',
        preview_url: f.url,
        thumbnail_url: f.mimeType?.startsWith('image/') ? f.url : null,
        mime_type: f.mimeType ?? null,
        name: f.name ?? null,
        size_bytes: f.size ?? null,
        created_at: new Date().toISOString(),
      }));
    setAssets((prev) => [...newAssets, ...prev]);
    // Refetch to sync with DB (handles duplicates, server-generated fields)
    await loadLibrary();
    showToast('success', files.length === 1 ? 'File uploaded' : `${files.length} files uploaded`);
  };

  const isLegacy = (a: LibraryAsset) => (a.provider || '').toLowerCase() === 'uploadcare';
  const currentAssets = assets.filter((a) => !isLegacy(a));
  const legacyAssets = assets.filter(isLegacy);

  const byType = (a: LibraryAsset) => {
    if (filter === 'image' && !(a.mime_type || '').startsWith('image/')) return false;
    if (filter === 'video' && !(a.mime_type || '').startsWith('video/')) return false;
    return true;
  };
  const bySearch = (a: LibraryAsset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (a.name || '').toLowerCase();
    return name.includes(q);
  };
  const sortAssets = (list: LibraryAsset[]) => {
    const sorted = [...list];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()));
    } else {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    }
    return sorted;
  };

  const filteredCurrent = useMemo(
    () => sortAssets(currentAssets.filter(byType).filter(bySearch)),
    [currentAssets, filter, searchQuery, sortOrder]
  );
  const filteredLegacy = useMemo(
    () => sortAssets(legacyAssets.filter(byType).filter(bySearch)),
    [legacyAssets, filter, searchQuery, sortOrder]
  );

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
      showToast('error', data.error || res.statusText);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    showToast('success', 'Removed from library');
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              filter === f
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
          </button>
        ))}
        <input
          type="search"
          placeholder="Search media…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          aria-label="Search media by name"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          aria-label="Sort order"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {assets.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12 text-slate-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No media yet</p>
            <p className="text-sm mt-1">Use the Upload button above to add files.</p>
          </div>
        </AdminCard>
      ) : (
        <>
        {filteredCurrent.length === 0 && !showLegacy ? (
          <AdminCard className="mb-6">
            <p className="text-slate-600 text-sm">No current media. Enable &quot;Show legacy items&quot; below to see older uploads.</p>
          </AdminCard>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredCurrent.map((asset) => {
            const isImage = (asset.mime_type || '').startsWith('image/');
            const thumb = asset.thumbnail_url || asset.preview_url || displayUrl(asset);
            return (
              <AdminCard key={asset.id} className="p-0 overflow-hidden flex flex-col">
                <div className="aspect-square w-full bg-slate-100 flex-shrink-0">
                  <MediaThumb
                    src={thumb || null}
                    isImage={isImage}
                    alt={asset.name || ''}
                    posterUrl={!isImage ? (asset.thumbnail_url || asset.preview_url) : null}
                    className="rounded-none w-full h-full !aspect-square"
                  />
                </div>
                <div className="p-3 space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate" title={asset.name || ''}>
                    {asset.name || 'Untitled'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{isImage ? 'Image' : 'Video'}</span>
                    <span>{formatDate(asset.created_at)}</span>
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

        {showLegacy && filteredLegacy.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Legacy</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredLegacy.map((asset) => {
                const isImage = (asset.mime_type || '').startsWith('image/');
                const thumb = asset.thumbnail_url || asset.preview_url || displayUrl(asset);
                return (
                  <AdminCard key={asset.id} className="p-0 overflow-hidden flex flex-col">
                    <div className="aspect-square w-full bg-slate-100 flex-shrink-0">
                      <MediaThumb
                        src={thumb || null}
                        isImage={isImage}
                        alt={asset.name || ''}
                        posterUrl={!isImage ? (asset.thumbnail_url || asset.preview_url) : null}
                        className="rounded-none w-full h-full !aspect-square"
                      />
                    </div>
                    <div className="p-3 space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate" title={asset.name || ''}>
                        {asset.name || 'Untitled'}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{isImage ? 'Image' : 'Video'}</span>
                        <span>{formatDate(asset.created_at)}</span>
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
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLegacy((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
          >
            {showLegacy ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Show legacy items
          </button>
          {legacyAssets.length > 0 && (
            <span className="text-xs text-slate-400">{legacyAssets.length} legacy</span>
          )}
        </div>

        <details
          className="mt-6 admin-card overflow-hidden"
          open={legacyDetailsOpen}
          onToggle={(e) => setLegacyDetailsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50">
            {legacyDetailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Advanced (asset IDs)
          </summary>
          <div className="px-4 pb-4 pt-0 border-t border-slate-200 text-sm text-slate-500">
            <p className="mb-3">Asset IDs are used for hero, gallery covers, events, and product images.</p>
            {assets.length > 0 && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Preview URL</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.slice(0, 20).map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs truncate max-w-[200px]" title={a.id}>{a.id}</td>
                      <td className="truncate max-w-[240px] text-slate-500" title={displayUrl(a) || ''}>{displayUrl(a) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {assets.length > 20 && <p className="mt-2 text-xs text-slate-400">Showing first 20 of {assets.length}.</p>}
          </div>
        </details>
        </>
      )}
    </AdminPage>
  );
}
