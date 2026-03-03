'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HeroContentProps {
  /** Optional small-caps eyebrow (e.g. "ELECTRONIC DUO") */
  eyebrow?: string | null;
  headline?: string | null;
  subtext?: string | null;
  /** Primary CTA (e.g. Listen Now) */
  ctaText?: string | null;
  ctaUrl?: string | null;
  /** Secondary CTA (e.g. Booking) */
  secondaryCtaText?: string | null;
  secondaryCtaUrl?: string | null;
}

const FADE_UP_DURATION = 0.52;
const FADE_UP_DELAY = 0.12;
const FADE_UP_Y = 14;

export function HeroContent({
  eyebrow,
  headline,
  subtext,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
}: HeroContentProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const duration = reducedMotion ? 0.01 : FADE_UP_DURATION;
  const delay = reducedMotion ? 0 : FADE_UP_DELAY;
  const y = reducedMotion ? 0 : FADE_UP_Y;

  if (!eyebrow && !headline && !subtext && !ctaText && !secondaryCtaText) return null;

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-4 mt-5 md:mt-6"
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-2xl w-full">
        {eyebrow && (
          <p className="type-label text-white/60 mb-2 tracking-[var(--letter-spacing-caps)]">
            {eyebrow}
          </p>
        )}
        {headline && (
          <h1 className="type-h1 text-white mb-3 md:mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {headline}
          </h1>
        )}
        {subtext && (
          <p className="type-subtitle text-white/85 mb-6 md:mb-8 max-w-xl mx-auto hero-text-shadow" style={{ fontFamily: 'var(--font-ui)' }}>
            {subtext}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4 gap-y-3">
          {ctaText && ctaUrl && (
            ctaUrl.startsWith('http') ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta-primary"
              >
                {ctaText}
              </a>
            ) : ctaUrl.startsWith('#') ? (
              <a
                href={ctaUrl}
                className="hero-cta-primary"
                onClick={(e) => {
                  const el = document.querySelector(ctaUrl);
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {ctaText}
              </a>
            ) : (
              <Link href={ctaUrl} className="hero-cta-primary">
                {ctaText}
              </Link>
            )
          )}
          {secondaryCtaText && secondaryCtaUrl && (
            <Link href={secondaryCtaUrl} className="hero-cta-secondary">
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
