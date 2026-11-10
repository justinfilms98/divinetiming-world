'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  compressMedia,
  formatBytes,
  willCompress,
  type CompressionPreset,
} from '@/lib/utils/compressMedia';
import { IMMUTABLE_CACHE_SECONDS } from '@/lib/media/cache';
import { isAcceptedFile, prepareFileForUpload } from '@/lib/media/uploadPolicy';

/** Optimization failed for `file`; nothing in `files` has been uploaded. */
type OptimizationFailure = {
  files: File[];
  file: File;
  reason: string;
  canUploadOriginal: boolean;
  originalLimit: number;
  allowOriginal: Set<File>;
};


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
  /**
   * Compress images/videos in the browser before upload.
   * Use "hero" for homepage hero slots (720p, ~8MB target).
   */
  compression?: boolean | CompressionPreset;
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
  compression = 'standard',
}: UniversalUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successDetail, setSuccessDetail] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [failure, setFailure] = useState<OptimizationFailure | null>(null);

  const maxBytes = getMaxBytes(maxSizeBytes);
  const accept = acceptOverride ?? acceptAttribute(acceptedTypes);
  const compressionEnabled = compression !== false;
  const compressionPreset: CompressionPreset =
    compression === true || compression === 'standard' ? 'standard' : compression === 'hero' ? 'hero' : 'standard';

  useEffect(() => {
    if (!uploading) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [uploading]);

  const processFiles = useCallback(
    async (files: FileList | File[], allowOriginal: Set<File> = new Set()) => {
      const list = Array.isArray(files) ? files : Array.from(files);
      if (!list.length) return;
      const invalid = list.find((f) => !isAcceptedFile(f, acceptedTypes, acceptOverride));
      if (invalid) {
        const allowedLabel = acceptOverride ?? acceptedTypes.map((t) => `${t}s`).join(' or ');
        setError(`"${invalid.name}" is not an allowed type here. Allowed: ${allowedLabel}.`);
        return;
      }
      const oversized = list.find((f) => f.size > maxBytes);
      if (oversized) {
        setError(`File "${oversized.name}" is too large. Max size: ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        return;
      }
      setError(null);
      setFailure(null);
      setSuccess(false);
      setSuccessDetail(null);
      setUploading(true);
      onUploadingChange?.(true);
      const total = list.length;
      const uploaded: Array<{ storage_path: string; public_url: string; name: string; mimeType: string; size: number }> = [];
      const compressionNotes: string[] = [];
      try {
        // 1) Optimize everything first, so a failure leaves nothing half-uploaded.
        const ready: File[] = [];
        for (let i = 0; i < list.length; i++) {
          const original = list[i]!;
          if (!original.size || original.size <= 0) {
            setError(`"${original.name}" is empty (0 bytes). Please re-select the file.`);
            return;
          }
          const fileBaseProgress = (i / total) * 100;
          const fileSpan = 100 / total;
          if (compressionEnabled && willCompress(original, compressionPreset) && !allowOriginal.has(original)) {
            setStatusLabel(original.type.startsWith('video/') ? 'Compressing video for web…' : 'Optimizing image…');
          }
          const prepared = await prepareFileForUpload(original, {
            compress: compressionEnabled,
            preset: compressionPreset,
            maxBytes,
            allowOriginal: allowOriginal.has(original),
            compressFn: (f) =>
              compressMedia(f, {
                preset: compressionPreset,
                imageMaxSizeMB: compressionPreset === 'hero' ? 2 : undefined,
                onProgress: (p) => setProgress(fileBaseProgress + (p / 100) * fileSpan * 0.4),
              }),
          });
          if (prepared.kind === 'failed') {
            setFailure({
              files: list,
              file: original,
              reason: prepared.reason,
              canUploadOriginal: prepared.canUploadOriginal,
              originalLimit: prepared.originalLimit,
              allowOriginal,
            });
            return;
          }
          if (prepared.note) compressionNotes.push(prepared.note);
          ready.push(prepared.file);
        }

        // 2) Upload.
        const supabase = createClient();
        for (let i = 0; i < ready.length; i++) {
          const file = ready[i]!;
          const fileBaseProgress = (i / total) * 100;
          const fileSpan = 100 / total;

          if (file.size > maxBytes) {
            setError(
              `"${file.name}" is still ${formatBytes(file.size)} after compression (max ${formatBytes(maxBytes)}). Try a shorter clip or lower resolution.`
            );
            return;
          }

          setStatusLabel('Uploading…');
          setProgress(fileBaseProgress + fileSpan * 0.45);

          const pathRes = await fetch('/api/admin/media/upload-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ filename: file.name }),
          });
          const pathData = await pathRes.json().catch(() => ({}));
          if (!pathRes.ok || !pathData?.path || !pathData?.token) {
            setError(typeof pathData?.error === 'string' ? pathData.error : 'Could not get upload URL.');
            return;
          }
          const { path, publicUrl, token } = pathData as {
            path: string;
            publicUrl: string;
            signedUrl: string;
            token: string;
          };

          // Use Supabase's purpose-built uploadToSignedUrl. The token alone
          // authenticates the upload — no logged-in browser session required —
          // and the client library guarantees the file body is streamed
          // correctly (a raw fetch PUT can silently send 0 bytes in some
          // browsers).
          const { error: uploadErr } = await supabase.storage
            .from('media')
            .uploadToSignedUrl(path, token, file, {
              contentType: file.type || 'application/octet-stream',
              // Paths are unique per upload (timestamped) and never overwritten, so a year is safe.
              cacheControl: IMMUTABLE_CACHE_SECONDS,
              upsert: false,
            });
          if (uploadErr) {
            setError(uploadErr.message || 'Storage upload failed.');
            return;
          }

          setProgress(fileBaseProgress + fileSpan * 0.9);
          uploaded.push({
            storage_path: path,
            public_url: publicUrl || path,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size ?? 0,
          });
        }

        if (uploaded.length === 0) {
          setError('Upload produced no files to register.');
          return;
        }
        setProgress(100);

        const regRes = await fetch('/api/admin/media/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ provider: 'supabase', files: uploaded }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok) {
          setError((regData?.error as string) || 'Failed to save to library.');
          return;
        }

        type AssetItem = { id: string; preview_url: string; provider?: string; name?: string | null; size_bytes?: number | null; mime_type?: string | null };
        const assets: AssetItem[] = Array.isArray(regData?.assets) ? regData.assets : [];
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
          if (compressionNotes.length) {
            setSuccessDetail(compressionNotes.join('; '));
          }
          setTimeout(() => {
            setSuccess(false);
            setSuccessDetail(null);
          }, 5000);
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
        setStatusLabel(null);
        onUploadingChange?.(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [multiple, onSelected, maxBytes, acceptOverride, acceptedTypes, onUploadingChange, compressionEnabled, compressionPreset]
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
    <div className={`inline-flex flex-col gap-3 w-full sm:w-auto max-w-full min-w-0 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="flex-1 min-w-0 break-words">{error.length > 120 ? `${error.slice(0, 120)}…` : error}</span>
          <button type="button" onClick={() => setError(null)} className="admin-icon-btn hover:bg-red-100 rounded shrink-0" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {failure && !uploading && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2" role="alert">
          <p className="font-medium break-words">&ldquo;{failure.file.name}&rdquo; was not uploaded.</p>
          <p className="break-words">
            {failure.reason}. Nothing was uploaded. Try again, or try on a computer — large videos can need more memory than a phone allows.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => processFiles(failure.files, failure.allowOriginal)}
              className="admin-tap min-h-11 rounded-lg bg-amber-900 px-4 text-sm font-medium text-white hover:bg-amber-800"
            >
              Try again
            </button>
            {failure.canUploadOriginal ? (
              <button
                type="button"
                onClick={() => processFiles(failure.files, new Set([...failure.allowOriginal, failure.file]))}
                className="admin-tap min-h-11 rounded-lg border border-amber-400 bg-amber-100 px-4 text-sm font-medium text-amber-900 hover:bg-amber-200"
              >
                Upload original anyway — not optimized ({formatBytes(failure.file.size)})
              </button>
            ) : (
              <p className="w-full text-xs text-amber-800">
                The original ({formatBytes(failure.file.size)}) is over the {formatBytes(failure.originalLimit)} limit for unoptimized uploads.
              </p>
            )}
            <button
              type="button"
              onClick={() => setFailure(null)}
              className="admin-tap min-h-11 rounded-lg px-4 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
          {failure.canUploadOriginal && (
            <p className="text-xs text-amber-800">
              An unoptimized file loads more slowly for visitors and uses more of the site&apos;s monthly bandwidth.
            </p>
          )}
        </div>
      )}
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm space-y-1">
          <p>Upload complete.</p>
          {successDetail && <p className="text-green-800/80 text-xs">{successDetail}</p>}
        </div>
      )}
      {(uploading || progress != null) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{statusLabel ?? 'Uploading…'}</span>
          </div>
          {progress != null && (
            <div className="h-1.5 w-full sm:max-w-[200px] rounded-full bg-slate-200 overflow-hidden">
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
          <span className="text-slate-600 text-sm">
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
            flex items-center justify-center text-center gap-2 px-4 py-3 min-h-[56px] w-full sm:w-auto sm:min-h-0 border-2 border-dashed rounded-lg text-sm font-medium
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
          {compressionEnabled
            ? 'Large videos are automatically compressed for web (720p on hero uploads) before upload. First video compression may take a minute while the compressor loads.'
            : 'Tip: You can pick files from iCloud Drive, Google Drive, OneDrive, or Dropbox if they appear in your device file picker.'}
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
