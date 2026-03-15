'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Mail, Inbox } from 'lucide-react';

interface BookingInquiry {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  budget_range: string | null;
  message: string;
  created_at: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function AdminBookingInquiriesPage() {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('booking_inquiries')
      .select('id, name, email, organization, event_type, event_date, location, budget_range, message, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message || 'Failed to load inquiries');
          return;
        }
        setInquiries((data || []) as BookingInquiry[]);
      });
  }, []);

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
      subtitle="Submitted inquiries from the booking form. Most recent first."
    >
      {inquiries.length === 0 ? (
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mb-4" aria-hidden />
            <p className="text-slate-600 font-medium">No inquiries yet</p>
            <p className="text-slate-500 text-sm mt-1">Inquiries submitted via the public booking form will appear here.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <AdminCard key={inq.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{inq.name}</span>
                    <a href={`mailto:${inq.email}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline">
                      <Mail className="w-4 h-4 shrink-0" />
                      {inq.email}
                    </a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-sm text-slate-600">
                    {inq.organization && <p><span className="font-medium text-slate-700">Company:</span> {inq.organization}</p>}
                    {inq.event_type && <p><span className="font-medium text-slate-700">Event type:</span> {inq.event_type}</p>}
                    {inq.event_date && <p><span className="font-medium text-slate-700">Date:</span> {inq.event_date}</p>}
                    {inq.location && <p><span className="font-medium text-slate-700">Location:</span> {inq.location}</p>}
                    {inq.budget_range && <p><span className="font-medium text-slate-700">Budget:</span> {inq.budget_range}</p>}
                  </div>
                  {inq.message && (
                    <p className="text-slate-700 text-sm mt-3 whitespace-pre-wrap border-t border-slate-200 pt-3">{inq.message}</p>
                  )}
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
