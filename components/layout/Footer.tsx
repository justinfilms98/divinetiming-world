'use client';

import Link from 'next/link';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';
import type { PlatformId } from '@/lib/platformLinks';
import type { SiteSettings } from '@/lib/types/content';

const FOOTER_LINKS = [
  { label: 'Events', href: '/events' },
  { label: 'Media', href: '/media' },
  { label: 'Shop', href: '/shop' },
  { label: 'Booking', href: '/booking' },
  { label: 'Press Kit', href: '/presskit' },
  { label: 'EPK', href: '/epk' },
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
    <footer className="border-t border-[var(--text)]/10 mt-auto bg-[var(--bg)]/50">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 pt-20 pb-16">
        <div className="flex flex-col items-center text-center gap-8">
          <div>
            <p
              className="text-sm font-semibold tracking-[0.12em] uppercase text-[var(--text)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Divine Timing
            </p>
            {byline && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 tracking-wide">
                By {byline}
              </p>
            )}
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {platformLinks.length > 0 && (
            <div className="flex items-center justify-center gap-4">
              {platformLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 p-1.5 rounded focus-ring"
                  aria-label={link.label}
                >
                  <PlatformIcon id={link.id} className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
