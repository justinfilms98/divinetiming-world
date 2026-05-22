'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics/track';

const BUDGET_OPTIONS = [
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000+',
  'To be discussed',
];

/**
 * Contact / booking inquiry form. Posts to the existing /api/booking endpoint
 * which writes into booking_inquiries.
 */
export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    eventType: '',
    eventDate: '',
    location: '',
    budgetRange: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization: formData.company,
          eventType: formData.eventType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      track({ event_name: 'contact_submit' });
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        eventType: '',
        eventDate: '',
        location: '',
        budgetRange: '',
        message: '',
      });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-w-0">
      {status === 'success' && (
        <div className="mb-6 p-5 rounded-[var(--radius-card)] border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--text)] text-center type-body">
          Thank you. Your message has been sent and we&apos;ll get back to you soon.
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-5 rounded-[var(--radius-card)] border border-[var(--text-muted)]/30 bg-white/5 text-[var(--text-muted)] text-center type-body">
          Something went wrong. Please try again or reach us by email or phone.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="company" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Company / Venue
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
              placeholder="Optional"
            />
          </div>

          <div>
            <label htmlFor="eventType" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Type of inquiry
            </label>
            <select
              id="eventType"
              value={formData.eventType}
              onChange={(e) => setFormData((p) => ({ ...p, eventType: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
            >
              <option value="">Select type</option>
              <option value="Booking">Booking</option>
              <option value="Press / Media">Press / Media</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Merch / Shop">Merch / Shop</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label htmlFor="eventDate" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Date (if booking)
            </label>
            <input
              id="eventDate"
              type="text"
              value={formData.eventDate}
              onChange={(e) => setFormData((p) => ({ ...p, eventDate: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
              placeholder="e.g. June 15, 2026"
            />
          </div>

          <div>
            <label htmlFor="location" className="block type-small text-[var(--text-muted)] font-medium mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
              placeholder="City, country"
            />
          </div>
        </div>

        <div>
          <label htmlFor="budgetRange" className="block type-small text-[var(--text-muted)] font-medium mb-2">
            Budget Range (if booking)
          </label>
          <select
            id="budgetRange"
            value={formData.budgetRange}
            onChange={(e) => setFormData((p) => ({ ...p, budgetRange: e.target.value }))}
            className="w-full min-h-[48px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors duration-200"
          >
            <option value="">Select range</option>
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block type-small text-[var(--text-muted)] font-medium mb-2">
            Message *
          </label>
          <textarea
            id="message"
            required
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            className="w-full min-h-[140px] px-4 py-3 bg-white/5 border border-[var(--accent)]/10 rounded-[var(--radius-button)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 resize-none transition-colors duration-200"
            placeholder="Tell us what you have in mind..."
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full min-h-[48px] py-4 hero-cta-primary disabled:opacity-50 disabled:cursor-not-allowed transition-[opacity,transform] duration-200 active:scale-[0.98]"
        >
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
