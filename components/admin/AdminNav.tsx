'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_GROUPS, isNavItemActive } from '@/components/admin/adminNavigation';
import { cn } from '@/lib/ui/cn';

interface AdminNavProps {
  collapsed?: boolean;
}

/** Desktop sidebar: the same five groups as the phone tab bar, as labelled sections. */
export function AdminNav({ collapsed }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 p-3" aria-label="Admin navigation">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          {collapsed ? (
            <div className="mx-auto my-1 h-px w-6 bg-white/10" aria-hidden />
          ) : (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, pathname);
            const base = cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 min-w-0 text-[13px] font-medium tracking-wide transition-colors border-l-[3px]',
              collapsed && 'justify-center px-0 border-l-transparent'
            );

            if (item.comingSoon) {
              return (
                <span
                  key={item.label}
                  title={collapsed ? `${item.label} (coming soon)` : undefined}
                  className={cn(base, 'border-l-transparent text-white/25 cursor-default')}
                  aria-disabled="true"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/35">
                        Soon
                      </span>
                    </>
                  )}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  base,
                  active
                    ? 'bg-[#C6A75E]/10 text-[#C6A75E] border-l-[#C6A75E]'
                    : 'border-l-transparent text-white/60 hover:bg-white/[0.06] hover:text-white/90',
                  collapsed && active && 'border-l-transparent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
