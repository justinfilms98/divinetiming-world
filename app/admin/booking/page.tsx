'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Mail, Download } from 'lucide-react';

interface BookingInquiry {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  event_date: string | null;
  location: string | null;
  budget_range: string | null;
  message: string;
  created_at: string;
}

export default function AdminBookingPage() {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    const { data } = await supabase
      .from('booking_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    setInquiries(data || []);
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportCsv = () => {
    const headers = ['Date', 'Name', 'Email', 'Organization', 'Event Date', 'Location', 'Budget', 'Message'];
    const rows = inquiries.map((i) => [
      formatDate(i.created_at),
      i.name,
      i.email,
      i.organization || '',
      i.event_date || '',
      i.location || '',
      i.budget_range || '',
      (i.message || '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Booking Inquiries" description="View and manage booking requests" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Booking Inquiries"
        description="Inquiries submitted through the booking form"
      />

      {inquiries.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      )}

      {inquiries.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No inquiries yet"
          description="Booking inquiries will appear here when submitted through the booking form."
        />
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <AdminCard key={inquiry.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{inquiry.name}</h3>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="text-[var(--accent)] hover:text-[var(--accent2)] text-sm"
                    >
                      {inquiry.email}
                    </a>
                  </div>
                  <span className="text-white/50 text-sm">{formatDate(inquiry.created_at)}</span>
                </div>

                {(inquiry.organization || inquiry.event_date || inquiry.location || inquiry.budget_range) && (
                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    {inquiry.organization && (
                      <span><strong>Org:</strong> {inquiry.organization}</span>
                    )}
                    {inquiry.event_date && (
                      <span><strong>Date:</strong> {inquiry.event_date}</span>
                    )}
                    {inquiry.location && (
                      <span><strong>Location:</strong> {inquiry.location}</span>
                    )}
                    {inquiry.budget_range && (
                      <span><strong>Budget:</strong> {inquiry.budget_range}</span>
                    )}
                  </div>
                )}

                <p className="text-white/80 whitespace-pre-line">{inquiry.message}</p>

                <a
                  href={`mailto:${inquiry.email}?subject=Re: Booking Inquiry from ${inquiry.name}`}
                  className="self-start px-4 py-2 bg-[var(--accent)]/20 text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/30 text-sm font-medium transition-colors"
                >
                  Reply
                </a>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </>
  );
}
