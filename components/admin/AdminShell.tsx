'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNav } from '@/components/admin/AdminNav';
import { OverflowDebug } from '@/components/dev/OverflowDebug';
import { LogOut, ExternalLink, PanelLeftClose, PanelLeft } from 'lucide-react';
import '@/app/admin/admin.css';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-active');
    return () => document.documentElement.classList.remove('admin-active');
  }, []);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="admin-root min-h-screen w-full overflow-x-hidden">
      <Suspense fallback={null}>
        <OverflowDebug />
      </Suspense>
      <div
        className="grid min-h-screen transition-[grid-template-columns] duration-200 ease-out"
        style={{ gridTemplateColumns: sidebarCollapsed ? '56px 1fr' : `${SIDEBAR_WIDTH}px 1fr` }}
      >
        <aside className="admin-sidebar shrink-0 flex flex-col border-r border-slate-200 min-w-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <Link
                href="/admin"
                className="text-lg font-bold text-slate-800 tracking-tight"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <AdminNav collapsed={sidebarCollapsed} />
          </div>
          <div className="p-3 border-t border-slate-200 space-y-0.5">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>View site</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1200px] px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
