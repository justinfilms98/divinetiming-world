'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClass =
  'w-full min-h-[48px] px-4 py-3 rounded-[var(--radius-button)] bg-[var(--bg)] border border-[var(--border-subtle)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 transition-colors';

export function TribeSection() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, country, source: 'homepage' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
      setFirstName('');
      setCountry('');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="band-dune">
      <Container className="section-padding">
        <Reveal className="max-w-xl mx-auto text-center">
          <p className="section-label mb-3">Community</p>
          <h2 className="type-h2 text-[var(--text)]">You found us</h2>
          <p className="type-body text-[var(--text-muted)] mt-4">
            New music, private events, early access and limited drops — sent when the timing
            is right.
          </p>

          {status === 'success' ? (
            <p
              className="type-subtitle text-[var(--text)] mt-8"
              role="status"
            >
              You&apos;re in. Welcome to the tribe.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tribe-name" className="sr-only">
                    First name (optional)
                  </label>
                  <input
                    id="tribe-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name (optional)"
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="tribe-country" className="sr-only">
                    Country (optional)
                  </label>
                  <input
                    id="tribe-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country (optional)"
                    autoComplete="country-name"
                    className={inputClass}
                  />
                </div>
              </div>

              <label htmlFor="tribe-email" className="sr-only">
                Email address
              </label>
              <input
                id="tribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="email"
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'tribe-error' : undefined}
                className={inputClass}
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                className="min-h-[48px] px-7 py-3 rounded-[var(--radius-button)] bg-[var(--accent)] text-[#0B0B0C] type-button font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 btn-lift glow focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Joining…' : 'Join the tribe'}
              </button>

              <p id="tribe-error" role="alert" className="type-caption text-center min-h-[1.2em]">
                {error}
              </p>
            </form>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
