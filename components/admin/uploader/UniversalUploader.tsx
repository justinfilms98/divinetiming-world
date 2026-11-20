'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBytes, type CompressionPreset } from '@/lib/utils/compressMedia';
import { IMMUTABLE_CACHE_SECONDS } from '@/lib/media/cache';
import { isAcceptedFile } from '@/lib/media/uploadPolicy';
import { prepareUploadMedia } from '@/lib/media/prepareUploadMedia';
import { acquireWakeLock } from '@/lib/media/wakeLock';

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
  thumbnailUrl?: string;
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
  if (types.includes('image')) mimes.push('image/*', '.heic', '.heif');
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

type SignedUpload = { path: string; publicUrl: string; token: string };

async function requestSignedUpload(filename: string, kind: 'library' | 'poster', signal: AbortSignal): Promise<SignedUpload> {
  const pathRes = await fetch('/api/admin/media/upload-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    signal,
    body: JSON.stringify({ filename, kind }),
  });
  const pathData = await pathRes.json().catch(() => ({}));
  if (!pathRes.ok || !pathData?.path || !pathData?.token) {
    throw new Error(typeof pathData?.error === 'string' ? pathData.error : 'Could not get upload URL.');
  }
  return {
    path: pathData.path as string,
    publicUrl: (pathData.publicUrl as string) || (pathData.path as string),
    token: pathData.token as string,
  };
}

/** Best-effort: remove session objects that never reached /register. Never throws. */
async function abandonUploadedPaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    await fetch('/api/admin/media/abandon-uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ paths }),
    });
  } catch {
    // Cleanup is best-effort; library registration never happened.
  }
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
  const abortRef = useRef<AbortController | null>(null);
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

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[], allowOriginal: Set<File> = new Set()) => {
      const list = Array.isArray(files) ? files : Array.from(files);
      if (!list.length) return;
      const invalid = list.find((f) => !isAcceptedFile(f, acceptedTypes, acceptOverride));
      // HEIC often arrives as empty type or application/octet-stream on some phones — allow by extension.
      const stillInvalid =
        invalid &&
        !(acceptedTypes.includes('image') && /\.(heic|heif)$/i.test(invalid.name));
      if (stillInvalid) {
        const allowedLabel = acceptOverride ?? acceptedTypes.map((t) => `${t}s`).join(' or ');
        setError(`"${invalid!.name}" is not an allowed type here. Allowed: ${allowedLabel}.`);
        return;
      }
      const oversized = list.find((f) => f.size > maxBytes);
      if (oversized) {
        setError(`File "${oversized.name}" is too large. Max size: ${Math.round(maxBytes / 1024 / 1024)}MB.`);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setError(null);
      setFailure(null);
      setSuccess(false);
      setSuccessDetail(null);
      setUploading(true);
      onUploadingChange?.(true);
      const wake = await acquireWakeLock();
      const total = list.length;
      const compressionNotes: string[] = [];

      type ReadyItem = {
        file: File;
        width: number | null;
        height: number | null;
        poster: File | null;
        durationSeconds: number | null;
      };
      const ready: ReadyItem[] = [];

      try {
        // 1) Prepare everything first so a failure leaves nothing half-uploaded.
        for (let i = 0; i < list.length; i++) {
          if (signal.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
          const original = list[i]!;
          if (!original.size || original.size <= 0) {
            setError(`"${original.name}" is empty (0 bytes). Please re-select the file.`);
            return;
          }
          const fileBaseProgress = (i / total) * 100;
          const fileSpan = 100 / total;
          setProgress(fileBaseProgress);

          if (!compressionEnabled) {
            ready.push({ file: original, width: null, height: null, poster: null, durationSeconds: null });
            continue;
          }

          const prepared = await prepareUploadMedia(original, {
            preset: compressionPreset,
            maxBytes,
            allowOriginal: allowOriginal.has(original),
            signal,
            onStatus: (label) => setStatusLabel(label),
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
          if (prepared.posterNote && prepared.poster) compressionNotes.push(prepared.posterNote);
          else if (prepared.posterNote) compressionNotes.push(prepared.posterNote);
          ready.push({
            file: prepared.file,
            width: prepared.width,
            height: prepared.height,
            poster: prepared.poster,
            durationSeconds: prepared.durationSeconds,
          });
          setProgress(fileBaseProgress + fileSpan * 0.4);
        }

        // 2) Upload media (+ posters) then register once.
        const supabase = createClient();
        const sessionPaths: string[] = [];
        let registered = false;
        const uploaded: Array<{
          storage_path: string;
          public_url: string;
          name: string;
          mimeType: string;
          size: number;
          width: number | null;
          height: number | null;
          thumbnail_url: string | null;
        }> = [];

        try {
        for (let i = 0; i < ready.length; i++) {
          if (signal.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
          const item = ready[i]!;
          const file = item.file;
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

          const signed = await requestSignedUpload(file.name, 'library', signal);
          const { error: uploadErr } = await supabase.storage.from('media').uploadToSignedUrl(signed.path, signed.token, file, {
            contentType: file.type || 'application/octet-stream',
            cacheControl: IMMUTABLE_CACHE_SECONDS,
            upsert: false,
          });
          if (uploadErr) {
            setError(uploadErr.message || 'Storage upload failed.');
            return;
          }
          // Track before abort checks so cancel-after-PUT still cleans up.
          sessionPaths.push(signed.path);
          if (signal.aborted) throw new DOMException('Upload cancelled.', 'AbortError');

          let thumbnailUrl: string | null = null;
          if (item.poster) {
            setStatusLabel('Uploading poster…');
            try {
              const posterSigned = await requestSignedUpload(item.poster.name, 'poster', signal);
              const { error: posterErr } = await supabase.storage
                .from('media')
                .uploadToSignedUrl(posterSigned.path, posterSigned.token, item.poster, {
                  contentType: item.poster.type || 'image/jpeg',
                  cacheControl: IMMUTABLE_CACHE_SECONDS,
                  upsert: false,
                });
              if (!posterErr) {
                sessionPaths.push(posterSigned.path);
                thumbnailUrl = posterSigned.publicUrl;
              } else compressionNotes.push(`Poster upload failed for ${file.name}; video was kept.`);
              if (signal.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
            } catch (err) {
              if (err instanceof DOMException && err.name === 'AbortError') throw err;
              compressionNotes.push(`Poster upload failed for ${file.name}; video was kept.`);
            }
          }

          setProgress(fileBaseProgress + fileSpan * 0.9);
          uploaded.push({
            storage_path: signed.path,
            public_url: signed.publicUrl,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size ?? 0,
            width: item.width,
            height: item.height,
            thumbnail_url: thumbnailUrl,
          });
        }

        if (signal.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
        if (uploaded.length === 0) {
          setError('Upload produced no files to register.');
          return;
        }
        setProgress(100);
        setStatusLabel('Saving to library…');

        const regRes = await fetch('/api/admin/media/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          signal,
          body: JSON.stringify({ provider: 'supabase', files: uploaded }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok) {
          setError((regData?.error as string) || 'Failed to save to library.');
          return;
        }
        registered = true;

        type AssetItem = {
          id: string;
          preview_url: string;
          thumbnail_url?: string | null;
          provider?: string;
          name?: string | null;
          size_bytes?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
        };
        const assets: AssetItem[] = Array.isArray(regData?.assets) ? regData.assets : [];
        const normalized: UploadedFile[] = assets.map((a) => ({
          url: a.preview_url,
          id: a.id,
          provider: a.provider || 'supabase',
          name: a.name ?? undefined,
          size: a.size_bytes ?? undefined,
          mimeType: a.mime_type ?? undefined,
          width: a.width ?? undefined,
          height: a.height ?? undefined,
          thumbnailUrl: a.thumbnail_url ?? undefined,
        }));

        if (normalized.length) {
          onSelected(multiple ? normalized : normalized.slice(0, 1));
          setSuccess(true);
          if (compressionNotes.length) setSuccessDetail(compressionNotes.join('; '));
          setTimeout(() => {
            setSuccess(false);
            setSuccessDetail(null);
          }, 6000);
        }
        } finally {
          // Cancel / register failure / early return after storage PUT: drop only this session's objects.
          if (!registered) await abandonUploadedPaths(sessionPaths);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Upload cancelled. Nothing new was saved to the library.');
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
            setError('Upload failed — try again. Check your connection.');
          } else {
            setError(msg || 'Upload failed — try again.');
          }
        }
      } finally {
        await wake.release();
        if (abortRef.current === controller) abortRef.current = null;
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

  return (
    <div className={`inline-flex flex-col gap-3 w-full sm:w-auto max-w-full min-w-0 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="flex-1 min-w-0 break-words">{error.length > 160 ? `${error.slice(0, 160)}…` : error}</span>
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
          {successDetail && <p className="text-green-800/80 text-xs break-words">{successDetail}</p>}
        </div>
      )}
      {(uploading || progress != null) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            <span className="min-w-0 break-words flex-1">{statusLabel ?? 'Uploading…'}</span>
            <button
              type="button"
              onClick={cancelUpload}
              className="admin-tap shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
          {progress != null && (
            <div className="h-1.5 w-full sm:max-w-[200px] rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-slate-600 transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          )}
          <p className="text-xs text-slate-500">
            Keep this tab open. On iPhone, long videos may still pause if the screen locks — cancel and retry on Wi‑Fi if needed.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!children && <span className="text-slate-600 text-sm">{buttonLabel}</span>}
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
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
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
            ${isDragging ? 'border-slate-500 bg-slate-100 text-slate-800' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-700'}
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
            ? 'Photos and large videos are prepared for the web before upload (HEIC converted when this browser can, posters for videos). First video compression may take a minute while the compressor loads.'
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
  const still = file.thumbnailUrl;
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      {isVideo ? (
        still ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of just-uploaded poster
          <img src={still} alt="" className="h-full w-full object-contain" />
        ) : (
          <video src={file.url} className="h-full w-full object-contain" muted playsInline controls={false} />
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt="" className="h-full w-full object-contain" />
      )}
    </div>
  );
}
