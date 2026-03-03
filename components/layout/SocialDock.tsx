'use client';

import type { SiteSettings } from '@/lib/types/content';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';

interface SocialDockProps {
  siteSettings?: SiteSettings | null;
}

export function SocialDock({ siteSettings }: SocialDockProps) {
  const links = getPlatformLinks(siteSettings ?? undefined);

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <div className="flex items-center gap-4 bg-[var(--bg)]/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors"
            aria-label={link.label}
          >
            <PlatformIcon id={link.id} className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  );
}
