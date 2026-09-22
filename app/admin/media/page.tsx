'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { MediaAssetEditor } from '@/components/admin/MediaAssetEditor';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { Image as ImageIcon, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';
import type { MediaLibraryAsset } from '@/lib/media/types';

type LibraryFilter = 'all' | 'image' | 'video';
type SortOrder = 'newest' | 'oldest' | 'name';
type ArchiveFilter = 'active' | 'archived' | 'all';

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function unwrapLibrary(payload: unknown): MediaLibraryAsset[] {
  if (Array.isArray(payload)) return payload as MediaLibraryAsset[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: MediaLibraryAsset[] }).data;
  }
  return [];
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyDetailsOpen, setLegacyDetailsOpen] = useState(false);
  const [editing, setEditing] = useState<MediaLibraryAsset | null>(null);
  const { showToast } = useAdminToast();

  const loadLibrary = useCallback(async () => {
    const res = await fetch('/api/admin/media-library?include_archived=1', {
      credentials: 'same-origin',
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast('error', typeof payload.error === 'string' ? payload.error : 'Could not load library');
      return;
    }
    setAssets(unwrapLibrary(payload.data ?? payload));
  }, [showToast]);

  const displayUrl = (asset: MediaLibraryAsset) =>
    asset.preview_url || asset.thumbnail_url || '';

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleUpload = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    const newAssets: MediaLibraryAsset[] = files
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
        usage_type: 'public',
        is_archived: false,
        is_featured: false,
        tags: [],
      }));
    setAssets((prev) => [...newAssets, ...prev]);
    await loadLibrary();
    showToast('success', files.length === 1 ? 'File uploaded' : `${files.length} files uploaded`);
  };

  const isLegacy = (a: MediaLibraryAsset) => (a.provider || '').toLowerCase() === 'uploadcare';
  const currentAssets = assets.filter((a) => !isLegacy(a));
  const legacyAssets = assets.filter(isLegacy);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      if (a.category?.trim()) set.add(a.category.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      for (const t of a.tags ?? []) {
        if (t.trim()) set.add(t.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const byType = (a: MediaLibraryAsset) => {
    if (filter === 'image' && !(a.mime_type || '').startsWith('image/')) return false;
    if (filter === 'video' && !(a.mime_type || '').startsWith('video/')) return false;
    return true;
  };
  const byArchive = (a: MediaLibraryAsset) => {
    if (archiveFilter === 'archived') return !!a.is_archived;
    if (archiveFilter === 'active') return !a.is_archived;
    return true;
  };
  const byCategory = (a: MediaLibraryAsset) =>
    !categoryFilter || (a.category || '') === categoryFilter;
  const byTag = (a: MediaLibraryAsset) =>
    !tagFilter || (a.tags ?? []).includes(tagFilter);
  const bySearch = (a: MediaLibraryAsset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const hay = [
      a.name,
      a.alt_text,
      a.photographer,
      a.location,
      a.category,
      ...(a.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  };
  const sortAssets = (list: MediaLibraryAsset[]) => {
    const sorted = [...list];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    }
    return sorted;
  };

  const applyFilters = (list: MediaLibraryAsset[]) =>
    sortAssets(list.filter(byType).filter(byArchive).filter(byCategory).filter(byTag).filter(bySearch));

  const filteredCurrent = useMemo(
    () => applyFilters(currentAssets),
    [currentAssets, filter, searchQuery, sortOrder, archiveFilter, categoryFilter, tagFilter]
  );
  const filteredLegacy = useMemo(
    () => applyFilters(legacyAssets),
    [legacyAssets, filter, searchQuery, sortOrder, archiveFilter, categoryFilter, tagFilter]
  );

  const handleCopyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete permanently? This cannot be undone.')) return;
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
    if (editing?.id === id) setEditing(null);
    showToast('success', 'Removed from library');
  };

  const renderCard = (asset: MediaLibraryAsset) => {
    const isImage = (asset.mime_type || '').startsWith('image/');
    const thumb = asset.thumbnail_url || asset.preview_url || displayUrl(asset);
    return (
      <AdminCard key={asset.id} className="p-0 overflow-hidden flex flex-col">
        <button
          type="button"
          onClick={() => setEditing(asset)}
          className="aspect-square w-full bg-slate-100 flex-shrink-0 text-left"
          title="Edit metadata"
        >
          <MediaThumb
            src={thumb || null}
            isImage={isImage}
            alt={asset.alt_text || asset.name || ''}
            posterUrl={!isImage ? (asset.thumbnail_url || asset.preview_url) : null}
            className="rounded-none w-full h-full !aspect-square"
          />
        </button>
        <div className="p-3 space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate" title={asset.name || ''}>
            {asset.name || 'Untitled'}
          </p>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {isImage ? 'Image' : 'Video'}
            </span>
            {asset.usage_type && asset.usage_type !== 'public' && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {asset.usage_type}
              </span>
            )}
            {asset.is_featured && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Featured</span>
            )}
            {asset.is_archived && (
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">Archived</span>
            )}
            <span>{formatDate(asset.captured_at || asset.created_at)}</span>
          </p>
          {asset.category && <p className="text-xs text-slate-400 truncate">{asset.category}</p>}
        </div>
        <div className="flex gap-2 p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setEditing(asset)}
            className="flex-1 px-2 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-700 text-xs font-medium"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleCopyUrl(displayUrl(asset) || asset.preview_url, asset.id)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
          >
            {copiedId === asset.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedId === asset.id ? 'Copied' : 'Copy'}
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
  };

  return (
    <AdminPage
      title="Media"
      subtitle="Upload and manage media library. Set tags, usage, and archive state. Video uploads also appear in the public Media → Videos tab when usage is public."
      actions={
        <UniversalUploader
          multiple
          onSelected={handleUpload}
          buttonLabel="Upload"
          className="inline-flex"
        />
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-6">
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
        <select
          value={archiveFilter}
          onChange={(e) => setArchiveFilter(e.target.value as ArchiveFilter)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Archive state"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All states</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search media…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          aria-label="Search media by name, tag, or credit"
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
            <p className="text-slate-600 text-sm">No media matches these filters. Adjust tag, category, or archive filters, or enable &quot;Show legacy items&quot;.</p>
          </AdminCard>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredCurrent.map(renderCard)}
        </div>

        {showLegacy && filteredLegacy.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Legacy</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredLegacy.map(renderCard)}
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

      {editing && (
        <MediaAssetEditor
          asset={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setAssets((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
            setEditing(null);
            showToast('success', 'Metadata saved');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </AdminPage>
  );
}
