'use client';

import { useState, useEffect } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, Calendar, Edit, Trash2, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react';
import { revalidateAfterSave } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';

type EventStatus = 'draft' | 'published' | 'archived';

interface Event {
  id: string;
  slug?: string | null;
  date: string;
  city: string;
  venue: string;
  ticket_url: string | null;
  is_featured: boolean;
  title: string | null;
  description: string | null;
  time: string | null;
  thumbnail_url: string | null;
  external_thumbnail_asset_id?: string | null;
  display_order: number;
  status?: EventStatus;
  resolved_thumbnail_url?: string | null;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const { showToast } = useAdminToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await fetch('/api/admin/events', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    if (body.ok && Array.isArray(body.data)) {
      setEvents(body.data as Event[]);
    } else {
      setEvents([]);
    }
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setPreviewThumbnail(null);
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setPreviewThumbnail(event.resolved_thumbnail_url ?? event.thumbnail_url ?? null);
    setModalOpen(true);
  };

  const handleThumbnailSelected = (files: UploadedFile[]) => {
    const file = files[0];
    if (!file) return;
    const input = document.querySelector('input[name="thumbnail_url"]') as HTMLInputElement;
    const extInput = document.querySelector('input[name="external_thumbnail_asset_id"]') as HTMLInputElement;
    if (input) input.value = file.url;
    if (extInput) extInput.value = file.id || '';
    setPreviewThumbnail(file.url);
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        thumbnail_url: file.url,
        external_thumbnail_asset_id: file.id ?? null,
      });
    }
  };

  const handleLibraryThumbnailSelect = (asset: { id: string; preview_url: string }) => {
    const input = document.querySelector('input[name="thumbnail_url"]') as HTMLInputElement;
    const extInput = document.querySelector('input[name="external_thumbnail_asset_id"]') as HTMLInputElement;
    if (input) input.value = asset.preview_url;
    if (extInput) extInput.value = asset.id;
    setPreviewThumbnail(asset.preview_url);
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        thumbnail_url: asset.preview_url,
        external_thumbnail_asset_id: asset.id,
      });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setPreviewThumbnail(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const rawThumb = formData.get('thumbnail_url');
    const rawExt = formData.get('external_thumbnail_asset_id');
    const thumbnailUrl = typeof rawThumb === 'string' ? rawThumb.trim() || null : null;
    const externalThumbId = typeof rawExt === 'string' ? rawExt.trim() || null : null;
    const slugValue = (formData.get('slug') as string)?.trim() || null;
    const payload: Record<string, unknown> = {
      date: formData.get('date') as string,
      city: formData.get('city') as string,
      venue: formData.get('venue') as string,
      status: (formData.get('status') as EventStatus) || 'published',
      ticket_url: (formData.get('ticket_url') as string) || null,
      is_featured: formData.get('is_featured') === 'on',
      title: (formData.get('title') as string) || null,
      description: (formData.get('description') as string) || null,
      time: (formData.get('time') as string) || null,
      thumbnail_url: thumbnailUrl || (editingEvent?.thumbnail_url ?? null),
      external_thumbnail_asset_id: externalThumbId || (editingEvent?.external_thumbnail_asset_id ?? null),
      slug: slugValue ?? (editingEvent?.slug ?? undefined),
    };
    if (editingEvent) {
      payload.id = editingEvent.id;
    } else {
      const maxOrder = events.length > 0 ? Math.max(...events.map((e) => e.display_order)) : -1;
      payload.display_order = maxOrder + 1;
    }

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast('error', (body.error as string) ?? res.statusText);
      return;
    }
    if (!body.ok) {
      showToast('error', (body.error as string) ?? 'Unknown error');
      return;
    }

    const updated = (body.data as { event?: Event })?.event;
    if (updated?.id) {
      setEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updated };
          return next;
        }
        return [...prev, updated];
      });
    }
    await loadEvents();
    await revalidateAfterSave('events');
    showToast('success', editingEvent ? 'Event updated' : 'Event created');
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      showToast('error', (body.error as string) ?? res.statusText);
      return;
    }
    await loadEvents();
    await revalidateAfterSave('events');
    showToast('success', 'Event deleted');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;

    const a = events[index];
    const b = events[targetIndex];

    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ swap: [a, b] }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      showToast('error', (body.error as string) ?? res.statusText);
      return;
    }
    await loadEvents();
    await revalidateAfterSave('events');
    showToast('success', 'Order updated');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AdminPage title="Events" subtitle="Manage tour dates and events">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Events"
      subtitle="Manage tour dates and upcoming shows"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      }
    >
      {events.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start building your tour schedule."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </button>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4">
          {events.map((event, index) => (
            <AdminCard key={event.id} className="p-0 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Thumbnail: resolved URL or premium placeholder */}
                <div className="md:w-40 md:flex-shrink-0">
                  {(event.resolved_thumbnail_url ?? event.thumbnail_url) ? (
                    <div className="relative aspect-video md:aspect-square w-full">
                      <MediaAssetRenderer
                        url={event.resolved_thumbnail_url ?? event.thumbnail_url!}
                        mediaType="image"
                        alt={event.title || event.city}
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <span className="text-white/30 text-2xl font-light">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).charAt(0)}
                            </span>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="aspect-video md:aspect-square bg-white/5 flex flex-col items-center justify-center gap-1">
                      <span className="text-white/30 text-3xl font-light">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).charAt(0)}
                      </span>
                      <span className="text-white/40 text-xs font-medium">No thumbnail</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[var(--accent)] text-sm font-semibold">
                        {formatDate(event.date)}
                        {event.time && ` · ${event.time}`}
                      </span>
                      {(event.status && event.status !== 'published') && (
                        <span className={`px-2 py-0.5 text-xs rounded ${event.status === 'draft' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {event.status === 'draft' ? 'Draft' : 'Archived'}
                        </span>
                      )}
                      {event.is_featured && (
                        <span className="px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{event.title || event.city}</h3>
                    <p className="text-white/70 text-sm">{[event.venue, event.city].filter(Boolean).join(' · ')}</p>
                    {event.description && (
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === events.length - 1}
                        className="p-1.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    {event.ticket_url && (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                        title="View tickets"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(event)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0c10] z-10">
              <h2 className="text-xl font-semibold text-white">
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </h2>
              <button onClick={closeModal} className="p-2 text-white/70 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form key={editingEvent?.id ?? 'new'} onSubmit={handleSubmit} className="p-4 space-y-4">
              <input type="hidden" name="thumbnail_url" defaultValue={editingEvent?.thumbnail_url ?? ''} />
              <input type="hidden" name="external_thumbnail_asset_id" defaultValue={editingEvent?.external_thumbnail_asset_id ?? ''} />

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Visibility</label>
                <select
                  name="status"
                  defaultValue={editingEvent?.status ?? 'published'}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="published">Published (visible on site)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="text-white/50 text-xs mt-1">Only published events appear on the public Events page.</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingEvent?.title || editingEvent?.city || ''}
                  placeholder="Event title (falls back to city)"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Event URL</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={editingEvent?.slug ?? ''}
                  placeholder={editingEvent ? 'e.g. my-event-2025-01-15' : 'Leave empty to auto-generate from title + date'}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
                <p className="text-white/50 text-xs mt-1">Used in event links (e.g. /events/my-event). Use lowercase with hyphens.</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail</label>
                {(previewThumbnail || editingEvent?.thumbnail_url || editingEvent?.resolved_thumbnail_url) ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={previewThumbnail || editingEvent?.thumbnail_url || editingEvent?.resolved_thumbnail_url || ''}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          const fb = t.nextElementSibling as HTMLElement;
                          if (fb) fb.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 hidden flex items-center justify-center bg-white/5 text-white/40 text-xs">Preview</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <UniversalUploader
                        acceptedTypes={['image']}
                        onSelected={handleThumbnailSelected}
                        onUploadingChange={setUploadInProgress}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:border-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setLibraryPickerOpen(true)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:border-slate-400"
                      >
                        Choose from library
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[name="thumbnail_url"]') as HTMLInputElement;
                          const extInput = document.querySelector('input[name="external_thumbnail_asset_id"]') as HTMLInputElement;
                          if (input) input.value = '';
                          if (extInput) extInput.value = '';
                          setPreviewThumbnail(null);
                          if (editingEvent) setEditingEvent({ ...editingEvent, thumbnail_url: null, external_thumbnail_asset_id: null });
                        }}
                        className="text-red-400/80 hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <UniversalUploader
                      acceptedTypes={['image']}
                      onSelected={handleThumbnailSelected}
                      onUploadingChange={setUploadInProgress}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      className="px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-500"
                    >
                      Choose from library
                    </button>
                  </div>
                )}
              </div>

              <MediaLibraryPicker
                open={libraryPickerOpen}
                onClose={() => setLibraryPickerOpen(false)}
                onSelect={handleLibraryThumbnailSelect}
                filter="image"
                title="Choose thumbnail from library"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().slice(0, 16) : ''}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Time (display)</label>
                  <input
                    type="text"
                    name="time"
                    defaultValue={editingEvent?.time || ''}
                    placeholder="e.g. 8:00 PM"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingEvent?.city || ''}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    defaultValue={editingEvent?.venue || ''}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingEvent?.description || ''}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                  placeholder="Optional event description"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Ticket URL</label>
                <input
                  type="url"
                  name="ticket_url"
                  defaultValue={editingEvent?.ticket_url || ''}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  id="is_featured"
                  defaultChecked={editingEvent?.is_featured || false}
                  className="w-4 h-4"
                />
                <label htmlFor="is_featured" className="text-white/70 text-sm">
                  Feature on homepage
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploadInProgress}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploadInProgress ? 'Uploading…' : editingEvent ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
