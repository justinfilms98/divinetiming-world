'use client';

import React, { useEffect, useRef, useState } from 'react';
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

interface UniversalUploaderProps {
  acceptedTypes?: ('image' | 'video')[];
  multiple?: boolean;
  onSelected: (assets: ExternalMediaAsset[]) => void;
  buttonLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

const UPLOADER_CTX = 'universal-uploader-ctx';

export function UniversalUploader({
  acceptedTypes = ['image', 'video'],
  multiple = false,
  onSelected,
  buttonLabel = 'Upload Media',
  className = '',
  children,
}: UniversalUploaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ucReady, setUcReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSelectedRef = useRef(onSelected);
  onSelectedRef.current = onSelected;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const pubKey =
      process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || process.env.UPLOADCARE_PUBLIC_KEY;
    if (!pubKey) return;

    let cancelled = false;

    import('@uploadcare/file-uploader').then((UC) => {
      if (cancelled) return;
      UC.defineComponents(UC);
      setUcReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (!ucReady) return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      const UC = await import('@uploadcare/file-uploader');
      // Wait for uploader element to register context
      for (let i = 0; i < 50; i++) {
        if (cancelled) return;
        const ctx = UC.Data.getCtx(UPLOADER_CTX);
        if (ctx) {
          unsub = ctx.sub(UC.EventType.COMMON_UPLOAD_SUCCESS, (payload: unknown) => {
            const p = payload as { successEntries?: Array<{ uuid: string; cdnUrl: string; mimeType: string; size: number; name: string }> };
            const entries = p?.successEntries || [];
            if (entries.length === 0) return;

            const files = entries.map((e) => ({
              uuid: e.uuid,
              cdnUrl: e.cdnUrl,
              mimeType: e.mimeType || 'application/octet-stream',
              size: e.size ?? 0,
              name: e.name || undefined,
            }));

            setError(null);
            setSaving(true);
            fetch('/api/assets/external', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider: 'uploadcare', files }),
              credentials: 'same-origin',
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.error) {
                  setError(data.error);
                  return;
                }
                if (data.assets && data.assets.length > 0) {
                  const assets = data.assets as ExternalMediaAsset[];
                  onSelectedRef.current(multiple ? assets : assets.slice(0, 1));
                }
              })
              .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to save media');
              })
              .finally(() => setSaving(false));
          });
          return;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    };
    setup();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [ucReady, multiple]);

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg text-white/50 ${className}`}
      >
        <Upload className="w-4 h-4" />
        Loading...
      </div>
    );
  }

  const pubKey =
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || process.env.UPLOADCARE_PUBLIC_KEY;
  if (!pubKey) {
    return (
      <button
        type="button"
        disabled
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg text-white/50 ${className}`}
      >
        <Upload className="w-4 h-4" />
        Add NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY to .env.local
      </button>
    );
  }

  return (
    <div ref={containerRef} className="inline-flex flex-col gap-2">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@uploadcare/file-uploader@1/web/uc-file-uploader-minimal.min.css"
      />
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
      {saving && (
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving to library…
        </div>
      )}
      {ucReady && (
        <div className="flex flex-wrap items-center gap-2">
          {!children && (
            <span className="text-white/80 text-sm whitespace-nowrap">{buttonLabel}</span>
          )}
          {React.createElement('uc-config', {
            'ctx-name': UPLOADER_CTX,
            pubkey: pubKey,
            'source-list': 'local, camera, url, google_drive, onedrive, dropbox',
          })}
          {React.createElement('uc-file-uploader-minimal', { 'ctx-name': UPLOADER_CTX })}
        </div>
      )}
    </div>
  );
}
