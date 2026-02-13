'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export interface ExternalMediaAsset {
  id: string;
  provider: string;
  file_id: string;
  preview_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  name: string | null;
}

interface UniversalUploaderProps {
  acceptedTypes?: ('image' | 'video')[];
  multiple?: boolean;
  onSelected: (assets: ExternalMediaAsset[]) => void;
  className?: string;
  children?: React.ReactNode;
}

const UPLOADER_CTX = 'universal-uploader-ctx';

export function UniversalUploader({
  acceptedTypes = ['image', 'video'],
  multiple = false,
  onSelected,
  className = '',
  children,
}: UniversalUploaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ucReady, setUcReady] = useState(false);
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

          fetch('/api/assets/external', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'uploadcare', files }),
            credentials: 'same-origin',
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.error) {
                alert('Upload failed: ' + data.error);
                return;
              }
              if (data.assets && data.assets.length > 0) {
                const assets = data.assets as ExternalMediaAsset[];
                onSelectedRef.current(multiple ? assets : [assets[0]]);
              }
            })
            .catch((err) => {
              alert(
                'Failed to save media: ' + (err instanceof Error ? err.message : 'Unknown error')
              );
            });
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
    <div ref={containerRef} className="inline-flex">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@uploadcare/file-uploader@1/web/uc-file-uploader-minimal.min.css"
      />
      {ucReady &&
        React.createElement(
          React.Fragment,
          null,
          React.createElement('uc-config', {
            'ctx-name': UPLOADER_CTX,
            pubkey: pubKey,
            'source-list': 'local, google_drive, onedrive, dropbox',
          }),
          React.createElement('uc-file-uploader-minimal', { 'ctx-name': UPLOADER_CTX })
        )}
    </div>
  );
}
