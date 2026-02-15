'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, Calendar, Edit, Trash2, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react';
import { revalidateAfterSave } from '@/lib/revalidate';
import { UniversalUploader } from '@/components/admin/UniversalUploader';
import { MediaAssetRenderer } from '@/components/ui/MediaAssetRenderer';

interface Event {
  id: string;
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
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('display_order', { ascending: true })
      .order('date', { ascending: true });
    setEvents((data || []) as Event[]);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setPreviewThumbnail(null);
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setPreviewThumbnail(event.thumbnail_url ?? null);
    setModalOpen(true);
  };

  const handleThumbnailSelected = (assets: { id: string; preview_url: string }[]) => {
    const asset = assets[0];
    if (!asset) return;
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

    const payload: Record<string, unknown> = {
      date: formData.get('date') as string,
      city: formData.get('city') as string,
      venue: formData.get('venue') as string,
      ticket_url: (formData.get('ticket_url') as string) || null,
      is_featured: formData.get('is_featured') === 'on',
      title: (formData.get('title') as string) || null,
      description: (formData.get('description') as string) || null,
      time: (formData.get('time') as string) || null,
      thumbnail_url: (formData.get('thumbnail_url') as string) || null,
      external_thumbnail_asset_id: (formData.get('external_thumbnail_asset_id') as string) || null,
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert('Error saving event: ' + (data.error || res.statusText));
      return;
    }

    await loadEvents();
    await revalidateAfterSave('events');
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert('Error deleting event: ' + (data.error || res.statusText));
      return;
    }
    await loadEvents();
    await revalidateAfterSave('events');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;

    const a = events[index];
    const b = events[targetIndex];
    const aOrder = a.display_order;
    const bOrder = b.display_order;

    await supabase.from('events').update({ display_order: bOrder, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('events').update({ display_order: aOrder, updated_at: new Date().toISOString() }).eq('id', b.id);
    await loadEvents();
    await revalidateAfterSave('events');
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
      <div>
        <PageHeader title="Events" description="Manage tour dates and events" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Events"
        description="Manage tour dates and upcoming shows"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        }
      />

      {events.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start building your tour schedule."
            action={
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
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
                {/* Thumbnail */}
                <div className="md:w-40 md:flex-shrink-0">
                  {event.thumbnail_url ? (
                    <div className="relative aspect-video md:aspect-square w-full">
                      <MediaAssetRenderer
                        url={event.thumbnail_url}
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
                    <div className="aspect-video md:aspect-square bg-white/5 flex items-center justify-center">
                      <span className="text-white/30 text-3xl font-light">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).charAt(0)}
                      </span>
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

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input type="hidden" name="thumbnail_url" defaultValue={editingEvent?.thumbnail_url || ''} />
              <input type="hidden" name="external_thumbnail_asset_id" defaultValue={editingEvent?.external_thumbnail_asset_id || ''} />

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
                <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail</label>
                {(previewThumbnail || editingEvent?.thumbnail_url) ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5">
                      <MediaAssetRenderer
                        url={previewThumbnail || editingEvent!.thumbnail_url!}
                        mediaType="image"
                        alt=""
                        fallback={<div className="absolute inset-0 bg-white/5" />}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <UniversalUploader
                        acceptedTypes={['image']}
                        onSelected={handleThumbnailSelected}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
                      />
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
                  <UniversalUploader
                    acceptedTypes={['image']}
                    onSelected={handleThumbnailSelected}
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg hover:border-[var(--accent)]"
                  />
                )}
              </div>

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
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
