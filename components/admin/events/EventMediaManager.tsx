'use client';

import { useCallback, useEffect, useState } from 'react';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminDialog } from '@/components/admin/AdminDialog';
import { Trash2, ChevronUp, ChevronDown, Video } from 'lucide-react';

interface EventMediaRow {
  id: string;
  event_id: string;
  media_type: 'image' | 'video';
  url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  external_media_asset_id: string | null;
  display_order: number;
  external_media_asset?: { id: string; preview_url: string | null; thumbnail_url: string | null; mime_type: string | null } | null;
}

interface EventMediaManagerProps {
  eventId: string;
}

function resolveUrl(row: EventMediaRow): string | null {
  return row.external_media_asset?.preview_url ?? row.url ?? row.thumbnail_url ?? null;
}

async function fetchEventMedia(eventId: string): Promise<EventMediaRow[]> {
  const res = await fetch(`/api/admin/event-media?event_id=${encodeURIComponent(eventId)}`, {
    credentials: 'same-origin',
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(body.media) ? (body.media as EventMediaRow[]) : [];
}

export function EventMediaManager({ eventId }: EventMediaManagerProps) {
  const [media, setMedia] = useState<EventMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useAdminToast();
  const dialog = useAdminDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setMedia(await fetchEventMedia(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    fetchEventMedia(eventId).then((rows) => {
      if (cancelled) return;
      setMedia(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleUploaded = async (files: UploadedFile[]) => {
    for (const f of files) {
      const isVideo = (f.mimeType ?? '').toLowerCase().startsWith('video/');
      const res = await fetch('/api/admin/event-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          event_id: eventId,
          media_type: isVideo ? 'video' : 'image',
          url: f.url,
          external_media_asset_id: f.id ?? null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast('error', (body.error as string) || 'Could not save media');
        return;
      }
    }
    showToast('success', `Added ${files.length} item${files.length === 1 ? '' : 's'}`);
    await load();
  };

  const handleDelete = async (id: string) => {
    const ok = await dialog.confirm({
      title: 'Remove this item from the event?',
      message: 'It will no longer appear on the public event page.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/event-media?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      showToast('error', 'Delete failed');
      return;
    }
    showToast('success', 'Removed');
    await load();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= media.length) return;
    const a = media[index];
    const b = media[target];
    if (!a || !b) return;
    const res = await fetch('/api/admin/event-media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        items: [
          { id: a.id, display_order: b.display_order },
          { id: b.id, display_order: a.display_order },
        ],
      }),
    });
    if (!res.ok) {
      showToast('error', 'Reorder failed');
      return;
    }
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white/70 text-sm font-medium">Event Media</p>
          <p className="text-white/50 text-xs mt-0.5">
            Photos and videos from the night. Shown on the public event detail page.
          </p>
        </div>
        <UniversalUploader
          acceptedTypes={['image', 'video']}
          multiple
          onSelected={handleUploaded}
          onUploadingChange={setUploading}
          buttonLabel="Add media"
          hideStorageTip
        />
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">Loading…</p>
      ) : media.length === 0 ? (
        <p className="text-white/50 text-sm">No media yet. Upload images or videos to display on the event page.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((m, i) => {
            const url = resolveUrl(m);
            return (
              <div key={m.id} className="relative group rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-square">
                {url ? (
                  m.media_type === 'video' ? (
                    <>
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </div>
                    </>
                  ) : (
                    <img src={url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                    No preview
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleMove(i, 'up')}
                      disabled={i === 0}
                      className="admin-icon-btn text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(i, 'down')}
                      disabled={i === media.length - 1}
                      className="admin-icon-btn text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="admin-icon-btn text-red-400/90 hover:text-red-400"
                    title="Remove"
                    aria-label="Remove media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {uploading && <p className="text-white/50 text-xs">Uploading…</p>}
    </div>
  );
}
