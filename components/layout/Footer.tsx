'use client';

import Link from 'next/link';
import { cn } from '@/lib/ui/cn';
import { ContentRail } from '@/components/layout/ContentRail';
import { SpiralMark } from '@/components/brand/SpiralMark';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { getFooterLinks } from '@/lib/site/footerLinks';
import type { SiteSettings } from '@/lib/types/content';
import { isLabelPublicEnabled } from '@/lib/features';

const SITEMAP_LINKS = [
  { label: 'Music', href: '/music' },
  { label: 'Events', href: '/events' },
  { label: 'Media', href: '/media' },
  { label: 'Shop', href: '/shop' },
  { label: 'Journey', href: '/journey' },
  { label: 'Book', href: '/booking' },
  { label: 'Contact', href: '/contact' },
  { label: 'Press Kit', href: '/presskit' },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Shipping', href: '/shipping' },
] as const;

/** 44px rows on touch screens; compact list on desktop. */
const FOOTER_LINK_CLASS =
  'inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 focus-ring rounded-sm';

export function Footer({
  siteSettings,
  className,
}: {
  siteSettings?: SiteSettings | null;
  className?: string;
}) {
  const member1 = siteSettings?.member_1_name?.trim() || 'Liam Bongo';
  const member2 = siteSettings?.member_2_name?.trim() || 'Lex Laurence';
  const byline = [member1, member2].filter(Boolean).join(' & ');
  const socialLinks = getFooterLinks(siteSettings);
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn('border-t border-[var(--text)]/10 bg-[var(--bg)]', className)}
      role="contentinfo"
    >
      <ContentRail className="py-10 md:py-20">
        <div className="w-full max-w-7xl mx-auto">
          {/*
            Mobile keeps a tight 2-col layout (Explore + Legal side by side).
            Brand sits above as a banner row; Connect drops under as its own
            row with the socials inline — this slashes mobile footer height
            from ~970px to ~430px while keeping the editorial structure on
            desktop (4-col at lg+).
          */}
          <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-x-6 gap-y-8 md:gap-x-10 md:gap-y-10 lg:gap-12">
            {/* Brand — spans full width on mobile, single col on desktop */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <SpiralMark size={28} className="shrink-0" title="DIVINE:TIMING spiral" />
                <p
                  className="text-base font-semibold tracking-[0.18em] uppercase text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Divine Timing
                </p>
              </div>
              {byline && (
                <p className="text-xs text-[var(--text-muted)] tracking-wide mt-2">{byline}</p>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed max-w-[34ch]">
                Live, evolving, in motion.
              </p>
            </div>

            {/* Sitemap */}
            <div>
              <p className="text-[11px] md:text-xs uppercase tracking-[0.2em] text-[var(--text)] font-medium mb-3 md:mb-4">
                Explore
              </p>
              <ul className="md:space-y-2.5">
                {SITEMAP_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={FOOTER_LINK_CLASS}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] md:text-xs uppercase tracking-[0.2em] text-[var(--text)] font-medium mb-3 md:mb-4">
                Legal
              </p>
              <ul className="md:space-y-2.5">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={FOOTER_LINK_CLASS}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect — full row on mobile, single col on desktop */}
            <div className="col-span-2 lg:col-span-1">
              <p className="text-[11px] md:text-xs uppercase tracking-[0.2em] text-[var(--text)] font-medium mb-3 md:mb-4">
                Connect
              </p>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:gap-5">
                <SocialLinks links={socialLinks} className="min-w-0 sm:flex-1 sm:max-w-[40rem] lg:max-w-none" />
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-button)] border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/60 transition-colors duration-200 focus-ring w-full sm:w-auto lg:self-start shrink-0 whitespace-nowrap"
                >
                  Reach out
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 md:mt-16 pt-5 md:pt-6 border-t border-[var(--text)]/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] md:text-xs text-[var(--text-muted)] tracking-wide text-center sm:text-left">
              © {year} Divine Timing. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {isLabelPublicEnabled() && (
                <Link
                  href="/label"
                  className="text-[11px] md:text-xs text-[var(--text-muted)]/70 tracking-wider hover:text-[var(--text-muted)] transition-colors duration-200"
                >
                  Label — coming soon
                </Link>
              )}
            <p className="text-[11px] md:text-xs text-[var(--text-muted)] tracking-wider uppercase">
              Made with care
            </p>
            </div>
          </div>
        </div>
      </ContentRail>
    </footer>
  );
}
