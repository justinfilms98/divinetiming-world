'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import { adminPageTitle } from '@/components/admin/adminNavigation';
import { AdminToastProvider } from '@/components/admin/AdminToast';
import { AdminDialogProvider } from '@/components/admin/AdminDialog';
import { LogOut, ExternalLink, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/ui/cn';
import '@/app/admin/admin.css';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';
const COLLAPSE_EVENT = 'admin-sidebar-collapse';

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}
const getCollapsed = () => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';

function setCollapsed(value: boolean) {
  window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '1' : '0');
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

const SIDE_LINK =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-colors w-full';

/**
 * Phones (< md): top bar with page title + bottom tab bar (AdminTabBar).
 * md and up: collapsible grouped sidebar. Layout switches in CSS so there's no
 * hydration flash; every admin route renders in the same <main>.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);
  const pageTitle = adminPageTitle(pathname);

  useEffect(() => {
    document.documentElement.classList.add('admin-active');
    return () => document.documentElement.classList.remove('admin-active');
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="admin-root min-h-screen w-full">
      <div
        className="min-h-screen md:grid md:transition-[grid-template-columns] md:duration-200"
        style={{ gridTemplateColumns: collapsed ? '56px minmax(0,1fr)' : '240px minmax(0,1fr)' }}
      >
        <aside className="admin-sidebar hidden md:flex sticky top-0 h-screen flex-col min-w-0">
          <div className="p-4 flex items-center justify-between gap-2 border-b border-white/[0.08]">
            {!collapsed && (
              <Link
                href="/admin"
                className="text-[#C6A75E] text-lg font-bold tracking-[0.08em]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-white/40 hover:text-white/90 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <AdminNav collapsed={collapsed} />
          </div>
          <div className="p-3 space-y-0.5 border-t border-white/[0.08]">
            <Link href="/" target="_blank" rel="noopener noreferrer" className={cn(SIDE_LINK, collapsed && 'justify-center')}>
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!collapsed && <span>View site</span>}
            </Link>
            <button type="button" onClick={handleLogout} className={cn(SIDE_LINK, collapsed && 'justify-center')}>
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex flex-col bg-[#0f0c10]">
          <header
            className="md:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-md px-4"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <p className="flex-1 min-w-0 truncate py-4 text-base font-semibold text-[#f5f0e8]">{pageTitle}</p>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View site"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 hover:bg-white/10"
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </header>

          {/* Bottom padding keeps page content clear of the phone tab bar (64px + home indicator). */}
          <main className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-10">
              <AdminToastProvider>
                <AdminDialogProvider>{children}</AdminDialogProvider>
              </AdminToastProvider>
            </div>
          </main>
        </div>
      </div>

      <AdminTabBar />
    </div>
  );
}
