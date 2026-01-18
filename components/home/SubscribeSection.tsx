'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.)
    // For now, just show success
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 500);
  };

  return (
    <section className="py-20 px-4 bg-[var(--bg2)]">
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4"
        >
          Stay Connected
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[var(--text)]/70 mb-8"
        >
          Get updates on new releases, tour dates, and exclusive content.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-3 bg-[var(--bg)] border border-[var(--accent)]/20 rounded-md text-[var(--text)] placeholder-[var(--text)]/50 focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow font-semibold disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
