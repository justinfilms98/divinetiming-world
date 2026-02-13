'use client';

import { useState } from 'react';

const BUDGET_OPTIONS = [
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000+',
  'To be discussed',
];

export function BookingForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
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
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        organization: '',
        eventDate: '',
        location: '',
        budgetRange: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center tracking-tight">
          Send an Inquiry
        </h2>

        {status === 'success' && (
          <div className="mb-8 p-6 bg-green-500/20 border border-green-500/40 rounded-xl text-green-200 text-center">
            Thank you! Your inquiry has been sent. We&apos;ll get back to you soon.
          </div>
        )}

        {status === 'error' && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-center">
            Something went wrong. Please try again or contact us directly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-white/80 text-sm font-medium mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="organization" className="block text-white/80 text-sm font-medium mb-2">
              Organization
            </label>
            <input
              id="organization"
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData((p) => ({ ...p, organization: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
              placeholder="Venue, festival, or company"
            />
          </div>

          <div>
            <label htmlFor="eventDate" className="block text-white/80 text-sm font-medium mb-2">
              Event Date
            </label>
            <input
              id="eventDate"
              type="text"
              value={formData.eventDate}
              onChange={(e) => setFormData((p) => ({ ...p, eventDate: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
              placeholder="e.g. June 15, 2025"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-white/80 text-sm font-medium mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]"
              placeholder="City, country"
            />
          </div>

          <div>
            <label htmlFor="budgetRange" className="block text-white/80 text-sm font-medium mb-2">
              Budget Range
            </label>
            <select
              id="budgetRange"
              value={formData.budgetRange}
              onChange={(e) => setFormData((p) => ({ ...p, budgetRange: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
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
            <label htmlFor="message" className="block text-white/80 text-sm font-medium mb-2">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Tell us about your event..."
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-semibold text-lg glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </section>
  );
}
