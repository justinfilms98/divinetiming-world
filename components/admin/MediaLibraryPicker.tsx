'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { X, Upload, Check } from 'lucide-react';
import { MediaThumb } from '@/components/admin/MediaThumb';

const LEGACY_STORAGE_KEY = 'dt_admin_media_include_legacy';

export interface LibraryAsset {
  id: string;
  provider?: string | null;
  preview_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  name: string | null;
}

interface MediaLibraryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: LibraryAsset) => void;
  /** 'image' | 'video' | 'all' */
  filter?: 'image' | 'video' | 'all';
  title?: string;
  /** When true, show checkbox to include legacy (uploadcare) items. Default false = only non-legacy. */
  showLegacyToggle?: boolean;
}

export function MediaLibraryPicker({
  open,
  onClose,
  onSelect,
  filter = 'image',
  title = 'Choose from library',
  showLegacyToggle = false,
}: MediaLibraryPickerProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      setIncludeLegacy(stored === 'true');
    } catch {
      setIncludeLegacy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedAsset(null);
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('external_media_assets')
          .select('id, provider, preview_url, thumbnail_url, mime_type, name')
          .order('created_at', { ascending: false });
        if (!cancelled) setAssets((data || []) as LibraryAsset[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, supabase]);

  const handleIncludeLegacyChange = (value: boolean) => {
    setIncludeLegacy(value);
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const isLegacy = (a: LibraryAsset) => (a.provider || '').toLowerCase() === 'uploadcare';
  const byFilter = (a: LibraryAsset) =>
    filter === 'all'
      ? true
      : filter === 'image'
        ? (a.mime_type || '').startsWith('image/')
        : (a.mime_type || '').startsWith('video/');
  const pool = showLegacyToggle && includeLegacy ? assets : assets.filter((a) => !isLegacy(a));
  const filtered = pool.filter(byFilter);

  const confirmSelection = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {showLegacyToggle && (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="picker-include-legacy"
                checked={includeLegacy}
                onChange={(e) => handleIncludeLegacyChange(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="picker-include-legacy" className="text-sm text-slate-600">Include legacy items</label>
            </div>
          )}
          {selectedAsset && (
            <div className="mb-4 p-3 rounded-lg border-2 border-slate-300 bg-slate-50 flex items-center gap-3">
              <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg">
                <MediaThumb
                  src={selectedAsset.thumbnail_url || selectedAsset.preview_url || null}
                  isImage={(selectedAsset.mime_type || '').startsWith('image/')}
                  alt={selectedAsset.name || ''}
                  posterUrl={(selectedAsset.mime_type || '').startsWith('video/') ? (selectedAsset.thumbnail_url || selectedAsset.preview_url) : null}
                  className="!aspect-square w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{selectedAsset.name || 'Untitled'}</p>
                <p className="text-xs text-slate-500">Selected — confirm below</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors duration-200"
                >
                  Choose another
                </button>
                <button
                  type="button"
                  onClick={confirmSelection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors duration-200"
                >
                  <Check className="w-4 h-4" />
                  Use this
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-3">No media in library.</p>
              <Link
                href="/admin/media"
                onClick={() => onClose()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors duration-200"
              >
                <Upload className="w-4 h-4" />
                Upload media
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {filtered.map((asset) => {
                const thumb = asset.thumbnail_url || asset.preview_url;
                const isImage = (asset.mime_type || '').startsWith('image/');
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${
                      isSelected ? 'border-slate-700 ring-2 ring-slate-400' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <MediaThumb
                      src={thumb || null}
                      isImage={isImage}
                      alt={asset.name || ''}
                      posterUrl={!isImage ? thumb : null}
                      className="!rounded-none w-full"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
