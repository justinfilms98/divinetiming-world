'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { X } from 'lucide-react';

export interface LibraryAsset {
  id: string;
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
}

export function MediaLibraryPicker({
  open,
  onClose,
  onSelect,
  filter = 'image',
  title = 'Choose from library',
}: MediaLibraryPickerProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('external_media_assets')
          .select('id, preview_url, thumbnail_url, mime_type, name')
          .order('created_at', { ascending: false });
        if (!cancelled) setAssets((data || []) as LibraryAsset[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, supabase]);

  const filtered =
    filter === 'all'
      ? assets
      : assets.filter((a) =>
          filter === 'image'
            ? (a.mime_type || '').startsWith('image/')
            : (a.mime_type || '').startsWith('video/')
        );

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
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm">No media in library. Upload from Media page first.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {filtered.map((asset) => {
                const thumb = asset.thumbnail_url || asset.preview_url;
                const isImage = (asset.mime_type || '').startsWith('image/');
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-slate-400 focus:border-slate-500 focus:outline-none"
                  >
                    {thumb && isImage ? (
                      <Image
                        src={thumb}
                        alt={asset.name || ''}
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized={thumb.includes('ucarecdn')}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                        {isImage ? '?' : '▶'}
                      </div>
                    )}
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
