import { PlatformIcon } from '@/lib/platformLinks';
import type { FooterLink } from '@/lib/site/footerLinks';
import { cn } from '@/lib/ui/cn';

/**
 * Icon-and-label social links in the owner-approved order. Sized by the space it sits in, not
 * the screen, so labels are never clipped: one per row below 19rem (the mobile menu), two
 * columns from 19rem with each Instagram handle on its own row, two rows of three from 38rem.
 */
export function SocialLinks({
  links,
  className,
  onNavigate,
}: {
  links: readonly FooterLink[];
  className?: string;
  onNavigate?: () => void;
}) {
  if (links.length === 0) return null;
  return (
    <div className={cn('@container w-full', className)}>
      <ul className="grid grid-cols-1 @[19rem]:grid-cols-2 @[38rem]:grid-cols-3 gap-2.5" aria-label="Social and music links">
        {links.map((link) => (
          <li key={link.key} className={cn('min-w-0', link.handle && '@[19rem]:col-span-2 @[38rem]:col-span-1')}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              aria-label={link.label}
              className="flex items-center gap-2.5 min-h-[44px] w-full px-3.5 rounded-xl border border-[var(--accent)]/25 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-colors duration-200 focus-ring"
            >
              <PlatformIcon id={link.icon} className="w-5 h-5 shrink-0" />
              <span className="min-w-0 truncate" aria-hidden>
                {link.handle ?? link.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
