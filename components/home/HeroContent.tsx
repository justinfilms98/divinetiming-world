'use client';

import { useState, useEffect, type ReactNode } from 'react';
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

/** External links open in a new tab; "#id" and "/#id" scroll smoothly when the section is on this page. */
function HeroCtaLink({ url, className, children }: { url: string; className: string; children: ReactNode }) {
  if (url.startsWith('http')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  const hash = url.startsWith('#') ? url : url.startsWith('/#') ? url.slice(1) : null;
  if (hash) {
    return (
      <a
        href={url}
        className={className}
        onClick={(e) => {
          if (url.startsWith('/#') && window.location.pathname !== '/') return;
          const el = document.querySelector(hash);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', hash);
          }
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {children}
    </Link>
  );
}

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
      className="flex flex-col items-center justify-center text-center px-4 mt-6 md:mt-8"
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-2xl w-full">
        {eyebrow && (
          <p className="type-hero-label text-white mb-2">
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
            <HeroCtaLink url={ctaUrl} className="hero-cta-primary">
              {ctaText}
            </HeroCtaLink>
          )}
          {secondaryCtaText && secondaryCtaUrl && (
            <HeroCtaLink url={secondaryCtaUrl} className="hero-cta-secondary">
              {secondaryCtaText}
            </HeroCtaLink>
          )}
        </div>
      </div>
    </motion.div>
  );
}
