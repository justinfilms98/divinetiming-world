'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MediaThumb } from '@/components/admin/MediaThumb';
import {
  MEDIA_CATEGORY_SUGGESTIONS,
  MEDIA_ORIENTATIONS,
  MEDIA_USAGE_TYPES,
  hasUsableAltText,
  parseMediaTags,
  type MediaLibraryAsset,
  type MediaOrientation,
  type MediaUsageType,
} from '@/lib/media/types';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400';

const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

interface MediaAssetEditorProps {
  asset: MediaLibraryAsset;
  onClose: () => void;
  onSaved: (asset: MediaLibraryAsset) => void;
  onError: (message: string) => void;
}

export function MediaAssetEditor({ asset, onClose, onSaved, onError }: MediaAssetEditorProps) {
  const [name, setName] = useState(asset.name ?? '');
  const [altText, setAltText] = useState(asset.alt_text ?? '');
  const [photographer, setPhotographer] = useState(asset.photographer ?? '');
  const [location, setLocation] = useState(asset.location ?? '');
  const [capturedAt, setCapturedAt] = useState(asset.captured_at ?? '');
  const [orientation, setOrientation] = useState<MediaOrientation | ''>(asset.orientation ?? '');
  const [category, setCategory] = useState(asset.category ?? '');
  const [tagsInput, setTagsInput] = useState((asset.tags ?? []).join(', '));
  const [usageType, setUsageType] = useState<MediaUsageType>(asset.usage_type ?? 'public');
  const [isFeatured, setIsFeatured] = useState(!!asset.is_featured);
  const [isArchived, setIsArchived] = useState(!!asset.is_archived);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(asset.name ?? '');
    setAltText(asset.alt_text ?? '');
    setPhotographer(asset.photographer ?? '');
    setLocation(asset.location ?? '');
    setCapturedAt(asset.captured_at ?? '');
    setOrientation(asset.orientation ?? '');
    setCategory(asset.category ?? '');
    setTagsInput((asset.tags ?? []).join(', '));
    setUsageType(asset.usage_type ?? 'public');
    setIsFeatured(!!asset.is_featured);
    setIsArchived(!!asset.is_archived);
  }, [asset]);

  const altOk = hasUsableAltText(altText);
  const isImage = (asset.mime_type || '').startsWith('image/');
  const thumb = asset.thumbnail_url || asset.preview_url;

  const handleSave = async () => {
    if (isFeatured && !altOk) {
      onError('Add alt text before marking this asset as featured.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/media-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: asset.id,
          name,
          alt_text: altText,
          photographer,
          location,
          captured_at: capturedAt,
          orientation: orientation || null,
          category,
          tags: parseMediaTags(tagsInput),
          usage_type: usageType,
          is_featured: isFeatured,
          is_archived: isArchived,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Could not save metadata.');
        return;
      }
      const saved = (data.data?.asset ?? data.asset) as MediaLibraryAsset | undefined;
      onSaved(saved ?? { ...asset, name, alt_text: altText });
    } catch {
      onError('Could not save metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-800">Edit media</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <MediaThumb
                src={thumb || null}
                isImage={isImage}
                alt={altText || name || ''}
                posterUrl={!isImage ? thumb : null}
                className="!aspect-square w-full h-full"
              />
            </div>
            <p className="text-xs text-slate-500 truncate" title={asset.id}>
              {asset.mime_type || 'file'}
            </p>
          </div>

          <div>
            <label htmlFor="media-name" className={labelClass}>
              Name
            </label>
            <input id="media-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label htmlFor="media-alt" className={labelClass}>
              Alt text {isFeatured || usageType !== 'internal' ? <span className="text-slate-400">(needed for featured / public use)</span> : null}
            </label>
            <textarea
              id="media-alt"
              rows={2}
              className={inputClass}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for screen readers and public pages"
            />
            {!altOk && (isFeatured || usageType === 'public') && (
              <p className="mt-1 text-xs text-amber-700">Add alt text before featuring this asset.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="media-photographer" className={labelClass}>
                Photographer
              </label>
              <input
                id="media-photographer"
                className={inputClass}
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="media-location" className={labelClass}>
                Location
              </label>
              <input
                id="media-location"
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="media-date" className={labelClass}>
                Date
              </label>
              <input
                id="media-date"
                type="date"
                className={inputClass}
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="media-orientation" className={labelClass}>
                Orientation
              </label>
              <select
                id="media-orientation"
                className={inputClass}
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as MediaOrientation | '')}
              >
                <option value="">—</option>
                {MEDIA_ORIENTATIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="media-category" className={labelClass}>
                Category
              </label>
              <input
                id="media-category"
                className={inputClass}
                list="media-category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="media-category-suggestions">
                {MEDIA_CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="media-usage" className={labelClass}>
                Usage
              </label>
              <select
                id="media-usage"
                className={inputClass}
                value={usageType}
                onChange={(e) => setUsageType(e.target.value as MediaUsageType)}
              >
                {MEDIA_USAGE_TYPES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="media-tags" className={labelClass}>
              Tags <span className="text-slate-400">(comma separated)</span>
            </label>
            <input
              id="media-tags"
              className={inputClass}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="live, sunset, festival"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isFeatured}
                disabled={!altOk && !isFeatured}
                onChange={(e) => {
                  if (e.target.checked && !altOk) {
                    onError('Add alt text before marking this asset as featured.');
                    return;
                  }
                  setIsFeatured(e.target.checked);
                }}
                className="rounded border-slate-300"
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="rounded border-slate-300"
              />
              Archived
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
