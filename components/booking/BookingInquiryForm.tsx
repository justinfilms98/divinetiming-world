'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics/track';

const EVENT_TYPES = [
  'Festival',
  'Club',
  'Private event',
  'Curated party',
  'Residency',
  'Corporate / brand',
  'Other',
];

const BUDGET_OPTIONS = [
  'Under $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000+',
  'To be discussed',
];

const HOW_HEARD_OPTIONS = [
  'Saw a live set',
  'Instagram',
  'YouTube',
  'Spotify / Apple Music',
  'Referral',
  'Agency',
  'Search',
  'Other',
];

const initialState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  eventName: '',
  eventType: '',
  city: '',
  country: '',
  venue: '',
  estimatedAttendance: '',
  eventDate: '',
  budgetRange: '',
  message: '',
  howHeard: '',
};

const fieldClass =
  'w-full min-h-[48px] px-4 py-3 rounded-[var(--radius-button)] bg-[var(--bg)] border border-[var(--border-subtle)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors';
const labelClass = 'block type-small text-[var(--text-muted)] font-medium mb-2';

export function BookingInquiryForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (key: keyof typeof initialState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      track({ event_name: 'contact_submit' });
      setStatus('success');
      setForm(initialState);
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-8 text-center"
      >
        <p className="type-h3 text-[var(--text)]">Inquiry received.</p>
        <p className="type-body text-[var(--text-muted)] mt-2">
          We&apos;ll come back to you with availability and details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="bk-name" className={labelClass}>Name *</label>
          <input id="bk-name" type="text" required value={form.name} onChange={set('name')}
            autoComplete="name" placeholder="Your name" className={fieldClass}
            aria-invalid={status === 'error'} aria-describedby={status === 'error' ? 'bk-error' : undefined} />
        </div>
        <div>
          <label htmlFor="bk-company" className={labelClass}>Company / agency</label>
          <input id="bk-company" type="text" value={form.company} onChange={set('company')}
            autoComplete="organization" placeholder="Optional" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-email" className={labelClass}>Email *</label>
          <input id="bk-email" type="email" required value={form.email} onChange={set('email')}
            autoComplete="email" placeholder="you@company.com" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-phone" className={labelClass}>Phone</label>
          <input id="bk-phone" type="tel" value={form.phone} onChange={set('phone')}
            autoComplete="tel" placeholder="Optional" className={fieldClass} />
        </div>
      </div>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <legend className="type-label mb-3">The event</legend>
        <div>
          <label htmlFor="bk-event-name" className={labelClass}>Event name</label>
          <input id="bk-event-name" type="text" value={form.eventName} onChange={set('eventName')}
            placeholder="Festival or event title" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-event-type" className={labelClass}>Event type</label>
          <select id="bk-event-type" value={form.eventType} onChange={set('eventType')} className={fieldClass}>
            <option value="">Select type</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bk-venue" className={labelClass}>Venue</label>
          <input id="bk-venue" type="text" value={form.venue} onChange={set('venue')}
            placeholder="Venue name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-date" className={labelClass}>Proposed date</label>
          <input id="bk-date" type="date" value={form.eventDate} onChange={set('eventDate')}
            min={new Date().toISOString().slice(0, 10)}
            className={`${fieldClass} [color-scheme:light]`} />
        </div>
        <div>
          <label htmlFor="bk-city" className={labelClass}>City</label>
          <input id="bk-city" type="text" value={form.city} onChange={set('city')}
            autoComplete="address-level2" placeholder="City" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-country" className={labelClass}>Country</label>
          <input id="bk-country" type="text" value={form.country} onChange={set('country')}
            autoComplete="country-name" placeholder="Country" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-attendance" className={labelClass}>Estimated attendance</label>
          <input id="bk-attendance" type="number" min={0} inputMode="numeric"
            value={form.estimatedAttendance} onChange={set('estimatedAttendance')}
            placeholder="e.g. 1500" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="bk-budget" className={labelClass}>Budget range</label>
          <select id="bk-budget" value={form.budgetRange} onChange={set('budgetRange')} className={fieldClass}>
            <option value="">Select range</option>
            {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </fieldset>

      <div>
        <label htmlFor="bk-message" className={labelClass}>Message *</label>
        <textarea id="bk-message" required rows={6} value={form.message} onChange={set('message')}
          placeholder="Tell us about the event, the audience and what you have in mind."
          className={`${fieldClass} resize-none`} />
      </div>

      <div>
        <label htmlFor="bk-how-heard" className={labelClass}>How did you hear about us?</label>
        <select id="bk-how-heard" value={form.howHeard} onChange={set('howHeard')} className={fieldClass}>
          <option value="">Select one</option>
          {HOW_HEARD_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full min-h-[48px] px-7 py-3 rounded-[var(--radius-button)] bg-[var(--accent)] text-[#0B0B0C] type-button font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 btn-lift glow focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Sending…' : 'Send booking inquiry'}
      </button>

      <p id="bk-error" role="alert" className="type-caption text-center min-h-[1.2em]">{error}</p>
    </form>
  );
}
