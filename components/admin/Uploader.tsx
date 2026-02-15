'use client';

import React, { useRef, useState } from 'react';
import { uploadFile } from '@uploadcare/upload-client';
import { Upload, Loader2, X } from 'lucide-react';

export interface ExternalMediaAsset {
  id: string;
  provider: string;
  file_id: string;
  preview_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  name: string | null;
  created_at?: string;
}

interface UploaderProps {
  acceptedTypes?: ('image' | 'video')[];
  multiple?: boolean;
  onSelected: (assets: ExternalMediaAsset[]) => void;
  buttonLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

const pubKey = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || process.env.UPLOADCARE_PUBLIC_KEY || ''
    : '';

function acceptAttribute(types: ('image' | 'video')[]): string {
  const mimes: string[] = [];
  if (types.includes('image')) mimes.push('image/*');
  if (types.includes('video')) mimes.push('video/*');
  return mimes.join(',') || 'image/*,video/*';
}

export function Uploader({
  acceptedTypes = ['image', 'video'],
  multiple = false,
  onSelected,
  buttonLabel = 'Upload Media',
  className = '',
  children,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const key = pubKey();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !key) return;
    setError(null);
    setUploading(true);
    const toProcess = multiple ? Array.from(files) : [files[0]!];
    try {
      const results: Array<{ uuid: string; cdnUrl: string; mimeType: string; size: number; name: string }> = [];
      for (let i = 0; i < toProcess.length; i++) {
        const file = toProcess[i]!;
        setProgress(i / toProcess.length * 100);
        const uc = await uploadFile(file, {
          publicKey: key,
          store: 'auto',
          onProgress: (p) => {
            if (p.isComputable) setProgress((i + p.value) / toProcess.length * 100);
          },
        });
        results.push({
          uuid: uc.uuid,
          cdnUrl: uc.cdnUrl,
          mimeType: uc.mimeType || 'application/octet-stream',
          size: uc.size ?? 0,
          name: uc.originalFilename || uc.name || file.name || '',
        });
      }
      setProgress(100);
      setSaving(true);
      const res = await fetch('/api/assets/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          provider: 'uploadcare',
          files: results.map((r) => ({
            uuid: r.uuid,
            cdnUrl: r.cdnUrl,
            mimeType: r.mimeType,
            size: r.size,
            name: r.name || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || res.statusText || 'Failed to save');
        return;
      }
      const assets = Array.isArray(data?.assets) ? (data.assets as ExternalMediaAsset[]) : [];
      if (assets.length) onSelected(multiple ? assets : assets.slice(0, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setSaving(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!key) {
    return (
      <div
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-amber-500/40 rounded-lg text-amber-200/90 bg-amber-500/10 ${className}`}
        role="alert"
      >
        <Upload className="w-4 h-4 shrink-0" />
        <span className="text-sm">Add NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY to .env.local</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-500/20 rounded"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {(uploading || saving) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            <span>{saving ? 'Saving to library…' : 'Uploading…'}</span>
          </div>
          {progress != null && (
            <div className="h-1.5 w-full max-w-[200px] rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!children && <span className="text-white/80 text-sm whitespace-nowrap">{buttonLabel}</span>}
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttribute(acceptedTypes)}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading || saving}
          className="hidden"
          aria-label={buttonLabel}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || saving}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-white/20 rounded-lg text-white/80 hover:border-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span>Choose file{multiple ? 's' : ''}</span>
        </button>
      </div>
    </div>
  );
}
