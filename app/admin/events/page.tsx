'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, Calendar, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });
    setEvents(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const eventData = {
      date: formData.get('date') as string,
      city: formData.get('city') as string,
      venue: formData.get('venue') as string,
      ticket_url: formData.get('ticket_url') as string || null,
      is_featured: formData.get('is_featured') === 'on',
    };

    if (editingEvent) {
      await supabase.from('events').update(eventData).eq('id', editingEvent.id);
    } else {
      await supabase.from('events').insert(eventData);
    }

    await loadEvents();
    setShowForm(false);
    setEditingEvent(null);
    alert('Event saved successfully!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    await loadEvents();
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
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
            onClick={() => {
              setShowForm(true);
              setEditingEvent(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        }
      />

      {showForm && (
        <AdminCard className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().slice(0, 16) : ''}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={editingEvent?.city || ''}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Venue</label>
              <input
                type="text"
                name="venue"
                defaultValue={editingEvent?.venue || ''}
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Ticket URL (optional)</label>
              <input
                type="url"
                name="ticket_url"
                defaultValue={editingEvent?.ticket_url || ''}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                placeholder="https://..."
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
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
                className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {events.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start building your tour schedule."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </button>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-[var(--accent)]" />
                    <div className="text-[var(--accent)] text-sm font-medium">
                      {formatDate(event.date)}
                    </div>
                    {event.is_featured && (
                      <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-semibold text-white mb-1">{event.city}</div>
                  <div className="text-white/70">{event.venue}</div>
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  {event.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="View tickets"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </>
  );
}
