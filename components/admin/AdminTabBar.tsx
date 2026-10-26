'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X } from 'lucide-react';
import {
  ADMIN_NAV_GROUPS,
  findActiveNav,
  isNavItemActive,
  type AdminNavGroup,
} from '@/components/admin/adminNavigation';
import { cn } from '@/lib/ui/cn';

/**
 * Phone navigation (< md): five fixed tabs. Single-page groups link directly;
 * the others open a bottom sheet listing that group's pages.
 */
export function AdminTabBar() {
  const pathname = usePathname();
  const activeGroupId = findActiveNav(pathname)?.group.id ?? null;
  const [openGroup, setOpenGroup] = useState<AdminNavGroup | null>(null);

  return (
    <>
      <nav
        aria-label="Admin sections"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {ADMIN_NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const active = group.id === activeGroupId;
            const single = group.items.length === 1 ? group.items[0] : null;
            const content = (
              <>
                <Icon className={cn('h-6 w-6', active ? 'text-[#C6A75E]' : 'text-white/55')} aria-hidden />
                <span className={cn('text-[11px] font-medium tracking-wide', active ? 'text-[#C6A75E]' : 'text-white/60')}>
                  {group.label}
                </span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#C6A75E]" aria-hidden />}
              </>
            );
            const cls =
              'relative flex h-16 w-full flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:bg-white/[0.06]';
            return (
              <li key={group.id}>
                {single ? (
                  <Link href={single.href} className={cls} aria-current={active ? 'page' : undefined}>
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cls}
                    aria-haspopup="dialog"
                    aria-expanded={openGroup?.id === group.id}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setOpenGroup(group)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {openGroup && <SectionSheet group={openGroup} pathname={pathname} onClose={() => setOpenGroup(null)} />}
    </>
  );
}

function SectionSheet({
  group,
  pathname,
  onClose,
}: {
  group: AdminNavGroup;
  pathname: string | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openedAt = useRef(pathname);

  // Close once navigation lands on a new page.
  useEffect(() => {
    if (pathname !== openedAt.current) onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${group.label} pages`}>
      <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#111013] shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="sticky top-0 flex items-center justify-between bg-[#111013] px-5 pt-3 pb-2">
          <div>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" aria-hidden />
            <p className="text-lg font-semibold text-[#f5f0e8]">{group.label}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${group.label}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="px-3 pb-2">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, pathname);
            const row = (
              <>
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    active ? 'bg-[#C6A75E]/15 text-[#C6A75E]' : 'bg-white/[0.05] text-white/70'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-base font-medium', active ? 'text-[#C6A75E]' : 'text-[#f5f0e8]')}>
                    {item.label}
                  </span>
                  <span className="block truncate text-sm text-white/50">{item.description}</span>
                </span>
                {item.comingSoon ? (
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-white/40">
                    Soon
                  </span>
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/30" aria-hidden />
                )}
              </>
            );
            const rowCls = 'flex min-h-[64px] items-center gap-4 rounded-2xl px-3 py-2';
            return (
              <li key={item.label}>
                {item.comingSoon ? (
                  <div className={cn(rowCls, 'opacity-60')} aria-disabled="true">
                    {row}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                    className={cn(
                      rowCls,
                      active ? 'bg-[#C6A75E]/[0.08]' : 'hover:bg-white/[0.05]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75E]'
                    )}
                  >
                    {row}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
