'use client';

import Link from 'next/link';
import { ContentRail } from '@/components/layout/ContentRail';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';
import type { PlatformId } from '@/lib/platformLinks';
import type { SiteSettings } from '@/lib/types/content';

const FOOTER_LINKS = [
  { label: 'Events', href: '/events' },
  { label: 'Media', href: '/media' },
  { label: 'Shop', href: '/shop' },
  { label: 'Booking', href: '/booking' },
  { label: 'Press Kit', href: '/presskit' },
] as const;

const FOOTER_SOCIAL_IDS: PlatformId[] = ['spotify', 'youtube', 'instagram'];

export function Footer({ siteSettings }: { siteSettings?: SiteSettings | null }) {
  const member1 = siteSettings?.member_1_name?.trim() || 'Liam Bongo';
  const member2 = siteSettings?.member_2_name?.trim() || 'Lex Laurence';
  const byline = [member1, member2].filter(Boolean).join(' & ');
  const platformLinks = getPlatformLinks(siteSettings ?? undefined).filter((link) =>
    FOOTER_SOCIAL_IDS.includes(link.id)
  );

  return (
    <footer className="border-t border-[var(--text)]/10 mt-auto bg-[var(--bg)]/60" role="contentinfo">
      <ContentRail className="py-16 md:py-20">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-1.5">
            <p
              className="text-sm font-semibold tracking-[0.14em] uppercase text-[var(--text)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Divine Timing
            </p>
            {byline && (
              <p className="text-xs text-[var(--text-muted)] tracking-wide">
                {byline}
              </p>
            )}
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-10 md:mt-12">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {platformLinks.length > 0 && (
            <div className="flex items-center justify-center gap-6 pt-1 mt-10 md:mt-12">
              {platformLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 p-2 rounded-lg focus-ring"
                  aria-label={link.label}
                >
                  <PlatformIcon id={link.id} className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </ContentRail>
    </footer>
  );
}
