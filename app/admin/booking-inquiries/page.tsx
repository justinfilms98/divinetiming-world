'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Mail, Inbox, Phone } from 'lucide-react';

type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'declined'
  | 'archived';

const STATUSES: InquiryStatus[] = [
  'new',
  'contacted',
  'negotiating',
  'confirmed',
  'declined',
  'archived',
];

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  negotiating: 'bg-purple-50 text-purple-700 border-purple-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface BookingInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  event_name: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  estimated_attendance: number | null;
  budget_range: string | null;
  how_heard: string | null;
  message: string;
  status: InquiryStatus;
  next_action: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminBookingInquiriesPage() {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/booking-inquiries');
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load inquiries');
      setInquiries(json.data.inquiries as BookingInquiry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, changes: { status?: InquiryStatus; next_action?: string }) => {
    setSavingId(id);
    // Optimistic: the list is long and a round-trip per keystroke would feel laggy.
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
    try {
      const res = await fetch('/api/admin/booking-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      if (!res.ok) await load();
    } catch {
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: inquiries.length };
    for (const s of STATUSES) map[s] = inquiries.filter((i) => i.status === s).length;
    return map;
  }, [inquiries]);

  const visible = useMemo(
    () => (filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter)),
    [inquiries, filter]
  );

  if (loading) {
    return (
      <AdminPage title="Booking Inquiries" subtitle="Submitted inquiries from the booking form">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage title="Booking Inquiries" subtitle="Submitted inquiries from the booking form">
        <AdminCard className="border-amber-200 bg-amber-50 text-amber-800">
          <p>{error}</p>
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Booking Inquiries"
      subtitle="Track every inquiry from first contact through to confirmation."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm border capitalize transition-colors ${
              filter === s
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {s} <span className="opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mb-4" aria-hidden />
            <p className="text-slate-600 font-medium">
              {filter === 'all' ? 'No inquiries yet' : `No ${filter} inquiries`}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Inquiries submitted via the booking form will appear here.
            </p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {visible.map((inq) => (
            <AdminCard key={inq.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${STATUS_STYLES[inq.status] ?? STATUS_STYLES.new}`}
                    >
                      {inq.status}
                    </span>
                    <span className="font-semibold text-slate-800">{inq.name}</span>
                    <a
                      href={`mailto:${inq.email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      {inq.email}
                    </a>
                    {inq.phone && (
                      <a
                        href={`tel:${inq.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:underline"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        {inq.phone}
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-sm text-slate-600">
                    {inq.organization && <p><span className="font-medium text-slate-700">Company:</span> {inq.organization}</p>}
                    {inq.event_name && <p><span className="font-medium text-slate-700">Event:</span> {inq.event_name}</p>}
                    {inq.event_type && <p><span className="font-medium text-slate-700">Type:</span> {inq.event_type}</p>}
                    {inq.event_date && <p><span className="font-medium text-slate-700">Date:</span> {inq.event_date}</p>}
                    {inq.venue && <p><span className="font-medium text-slate-700">Venue:</span> {inq.venue}</p>}
                    {(inq.city || inq.country) && (
                      <p>
                        <span className="font-medium text-slate-700">Where:</span>{' '}
                        {[inq.city, inq.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {!inq.city && !inq.country && inq.location && (
                      <p><span className="font-medium text-slate-700">Location:</span> {inq.location}</p>
                    )}
                    {inq.estimated_attendance != null && (
                      <p><span className="font-medium text-slate-700">Attendance:</span> {inq.estimated_attendance.toLocaleString()}</p>
                    )}
                    {inq.budget_range && <p><span className="font-medium text-slate-700">Budget:</span> {inq.budget_range}</p>}
                    {inq.how_heard && <p><span className="font-medium text-slate-700">Heard via:</span> {inq.how_heard}</p>}
                  </div>

                  {inq.message && (
                    <p className="text-slate-700 text-sm mt-3 whitespace-pre-wrap border-t border-slate-200 pt-3">
                      {inq.message}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
                    <label className="text-sm text-slate-600">
                      Status
                      <select
                        value={inq.status}
                        onChange={(e) => patch(inq.id, { status: e.target.value as InquiryStatus })}
                        className="ml-2 px-2 py-1 rounded border border-slate-300 text-sm capitalize bg-white"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-slate-600 flex-1 min-w-[220px]">
                      Next action
                      <input
                        type="text"
                        defaultValue={inq.next_action ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (inq.next_action ?? '')) {
                            patch(inq.id, { next_action: e.target.value });
                          }
                        }}
                        placeholder="e.g. send offer by Friday"
                        className="ml-2 px-2 py-1 rounded border border-slate-300 text-sm w-full sm:w-auto sm:min-w-[240px]"
                      />
                    </label>
                    {savingId === inq.id && <span className="text-xs text-slate-400">Saving…</span>}
                  </div>
                </div>

                <p className="text-slate-400 text-xs shrink-0">{formatDate(inq.created_at)}</p>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
