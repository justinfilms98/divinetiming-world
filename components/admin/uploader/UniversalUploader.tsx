'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Loader2, X } from 'lucide-react';

export type UploadedFile = {
  url: string;
  id?: string;
  provider?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
};

/** Default max file size (100MB). Override via env NEXT_PUBLIC_UPLOAD_MAX_BYTES. */
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

interface UniversalUploaderProps {
  acceptedTypes?: ('image' | 'video')[];
  multiple?: boolean;
  onSelected: (files: UploadedFile[]) => void;
  buttonLabel?: string;
  className?: string;
  children?: React.ReactNode;
  /** Max file size in bytes. Default from env NEXT_PUBLIC_UPLOAD_MAX_BYTES or 100MB. */
  maxSizeBytes?: number;
  /** Override HTML accept and validate MIME (e.g. "image/png" for logo). */
  acceptOverride?: string;
  /** Notify parent when upload starts/ends so Save can be disabled during upload. */
  onUploadingChange?: (uploading: boolean) => void;
  /** Hide the cloud-drive tip; use when help is in a separate collapsible. */
  hideStorageTip?: boolean;
}


function acceptAttribute(types: ('image' | 'video')[]): string {
  const mimes: string[] = [];
  if (types.includes('image')) mimes.push('image/*');
  if (types.includes('video')) mimes.push('video/*');
  return mimes.join(',') || 'image/*,video/*';
}

function getMaxBytes(override?: number): number {
  if (override != null && override > 0) return override;
  if (typeof window !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES;
    if (env) {
      const n = parseInt(env, 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return DEFAULT_MAX_BYTES;
}

export function UniversalUploader({
  acceptedTypes = ['image', 'video'],
  multiple = false,
  onSelected,
  buttonLabel = 'Choose file',
  className = '',
  children,
  maxSizeBytes,
  acceptOverride,
  onUploadingChange,
  hideStorageTip = false,
}: UniversalUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const maxBytes = getMaxBytes(maxSizeBytes);
  const accept = acceptOverride ?? acceptAttribute(acceptedTypes);

  useEffect(() => {
    if (!uploading) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [uploading]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.isArray(files) ? files : Array.from(files);
      if (!list.length) return;
      if (acceptOverride) {
        const allowed = acceptOverride.split(',').map((s) => s.trim().toLowerCase());
        const invalid = list.find((f) => {
          const t = (f.type || '').toLowerCase();
          const ok = allowed.some((a) => a === t || a === '*/*' || (a.endsWith('/*') && t.startsWith(a.replace(/\/\*$/, '/'))));
          return !ok;
        });
        if (invalid) {
          setError(`"${invalid.name}" is not an allowed type. Allowed: ${acceptOverride}`);
          return;
        }
      }
      const oversized = list.find((f) => f.size > maxBytes);
      if (oversized) {
        setError(`File "${oversized.name}" is too large. Max size: ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        return;
      }
      setError(null);
      setSuccess(false);
      setUploading(true);
      onUploadingChange?.(true);
      const total = list.length;
      const results: Array<{ storage_path: string; public_url: string; name: string; mimeType: string; size: number }> = [];
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i]!;
          setProgress((i / total) * 100);
          const form = new FormData();
          form.append('file', file);
          const uploadRes = await fetch('/api/admin/media/upload', {
            method: 'POST',
            credentials: 'same-origin',
            body: form,
          });
          const uploadData = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok) {
            const serverMessage = typeof uploadData?.error === 'string' ? uploadData.error : '';
            setError(serverMessage || uploadRes.statusText || (uploadRes.status === 503 ? 'Storage not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.' : 'Upload failed'));
            return;
          }
          if (uploadData?.storage_path && uploadData?.public_url) {
            results.push({
              storage_path: uploadData.storage_path,
              public_url: uploadData.public_url,
              name: uploadData.name ?? file.name,
              mimeType: uploadData.mimeType ?? file.type ?? 'application/octet-stream',
              size: uploadData.size ?? file.size ?? 0,
            });
          }
        }
        setProgress(100);
        if (results.length === 0) {
          setError('Upload produced no files to register.');
          return;
        }
        const res = await fetch('/api/admin/media/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ provider: 'supabase', files: results }),
        });
        let data: { assets?: unknown[]; error?: string } = {};
        try {
          const text = await res.text();
          data = (JSON.parse(text) as { assets?: unknown[]; error?: string }) ?? {};
        } catch {
          setError('Failed to save to library. The server returned an unexpected response.');
          return;
        }
        if (!res.ok) {
          setError(data?.error || res.statusText || 'Failed to save to library. Check API and try again.');
          return;
        }
        type AssetItem = { id: string; preview_url: string; provider?: string; name?: string | null; size_bytes?: number | null; mime_type?: string | null };
        const assets: AssetItem[] = Array.isArray(data?.assets) ? (data.assets as AssetItem[]) : [];
        const normalized: UploadedFile[] = assets.map((a) => ({
          url: a.preview_url,
          id: a.id,
          provider: a.provider || 'supabase',
          name: a.name ?? undefined,
          size: a.size_bytes ?? undefined,
          mimeType: a.mime_type ?? undefined,
        }));
        if (normalized.length) {
          onSelected(multiple ? normalized : normalized.slice(0, 1));
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2500);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
          setError('Upload failed — try again. Check your connection.');
        } else {
          setError(msg || 'Upload failed — try again.');
        }
      } finally {
        setUploading(false);
        setProgress(null);
        onUploadingChange?.(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [multiple, onSelected, maxBytes, acceptOverride, onUploadingChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const toProcess = multiple ? Array.from(files) : [files[0]!];
    processFiles(toProcess);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (!files?.length) return;
      const list = multiple ? Array.from(files) : [files[0]!];
      processFiles(list);
    },
    [multiple, processFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className={`inline-flex flex-col gap-3 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="flex-1 min-w-0">{error.length > 120 ? `${error.slice(0, 120)}…` : error}</span>
          <button type="button" onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded shrink-0" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Upload complete.
        </div>
      )}
      {(uploading || progress != null) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            <span>Uploading…</span>
          </div>
          {progress != null && (
            <div className="h-1.5 w-full max-w-[200px] rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-slate-600 transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!children && (
          <span className="text-slate-600 text-sm whitespace-nowrap">
            {buttonLabel}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          aria-label={buttonLabel}
        />
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`
            flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-sm font-medium
            transition-colors cursor-pointer
            ${isDragging
              ? 'border-slate-500 bg-slate-100 text-slate-800'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-700'}
            disabled:opacity-50 disabled:pointer-events-none
          `}
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span>Drag & drop or choose file{multiple ? 's' : ''}</span>
        </div>
      </div>
      {!hideStorageTip && (
        <p className="text-slate-500 text-xs max-w-sm">
          Tip: You can pick files from iCloud Drive, Google Drive, OneDrive, or Dropbox if they appear in your device file picker.
        </p>
      )}
    </div>
  );
}

/** Preview area for a single UploadedFile (image thumbnail or video poster/playable). */
export function UploadedFilePreview({
  file,
  className = '',
}: {
  file: UploadedFile;
  className?: string;
}) {
  const isVideo = (file.mimeType || '').startsWith('video/');
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video max-h-40 ${className}`}
    >
      {isVideo ? (
        <video
          src={file.url}
          controls
          className="w-full h-full object-contain"
          poster={undefined}
        />
      ) : (
        <img
          src={file.url}
          alt={file.name || 'Preview'}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
