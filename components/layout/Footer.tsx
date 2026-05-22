'use client';

import Link from 'next/link';
import { ContentRail } from '@/components/layout/ContentRail';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';
import type { PlatformId } from '@/lib/platformLinks';
import type { SiteSettings } from '@/lib/types/content';

const SITEMAP_LINKS = [
  { label: 'Events', href: '/events' },
  { label: 'Media', href: '/media' },
  { label: 'Shop', href: '/shop' },
  { label: 'Journey', href: '/journey' },
  { label: 'Contact', href: '/contact' },
  { label: 'Press Kit', href: '/presskit' },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Shipping', href: '/shipping' },
] as const;

const FOOTER_SOCIAL_IDS: PlatformId[] = ['spotify', 'youtube', 'instagram'];

export function Footer({ siteSettings }: { siteSettings?: SiteSettings | null }) {
  const member1 = siteSettings?.member_1_name?.trim() || 'Liam Bongo';
  const member2 = siteSettings?.member_2_name?.trim() || 'Lex Laurence';
  const byline = [member1, member2].filter(Boolean).join(' & ');
  const platformLinks = getPlatformLinks(siteSettings ?? undefined).filter((link) =>
    FOOTER_SOCIAL_IDS.includes(link.id)
  );
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[var(--text)]/10 mt-auto bg-[var(--bg)]/60"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 md:gap-x-10 md:gap-y-10 lg:gap-12">
            {/* Brand — spans full width on mobile, single col on desktop */}
            <div className="col-span-2 lg:col-span-1">
              <p
                className="text-base font-semibold tracking-[0.18em] uppercase text-[var(--text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Divine Timing
              </p>
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
              <ul className="space-y-2 md:space-y-2.5">
                {SITEMAP_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
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
              <ul className="space-y-2 md:space-y-2.5">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
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
              <div className="flex items-center justify-between lg:justify-start gap-4 flex-wrap">
                {platformLinks.length > 0 && (
                  <div className="flex items-center gap-2 md:gap-3">
                    {platformLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 p-2 -m-2 rounded-lg focus-ring"
                        aria-label={link.label}
                      >
                        <PlatformIcon id={link.id} className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                )}
                <Link
                  href="/contact"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 underline-offset-4 hover:underline lg:ml-2"
                >
                  Reach out
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 md:mt-16 pt-5 md:pt-6 border-t border-[var(--text)]/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] md:text-xs text-[var(--text-muted)] tracking-wide text-center sm:text-left">
              © {year} Divine Timing. All rights reserved.
            </p>
            <p className="text-[11px] md:text-xs text-[var(--text-muted)]/70 tracking-wider uppercase">
              Made with care
            </p>
          </div>
        </div>
      </ContentRail>
    </footer>
  );
}
