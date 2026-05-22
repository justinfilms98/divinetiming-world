'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminToastProvider } from '@/components/admin/AdminToast';
import { OverflowDebug } from '@/components/dev/OverflowDebug';
import { LogOut, ExternalLink, PanelLeftClose, PanelLeft } from 'lucide-react';
import '@/app/admin/admin.css';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';
const MOBILE_BREAKPOINT = 768;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-active');
    return () => document.documentElement.classList.remove('admin-active');
  }, []);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    }
  }, [sidebarCollapsed, isMobile]);

  const effectiveCollapsed = isMobile || sidebarCollapsed;

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
        style={{ gridTemplateColumns: effectiveCollapsed ? '56px 1fr' : `${SIDEBAR_WIDTH}px 1fr` }}
      >
        <aside
          className="admin-sidebar shrink-0 flex flex-col min-w-0"
          style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="p-4 flex items-center justify-between gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {!effectiveCollapsed && (
              <Link
                href="/admin"
                style={{
                  color: '#C6A75E',
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {effectiveCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <AdminNav collapsed={effectiveCollapsed} />
          </div>
          <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!effectiveCollapsed && <span>View site</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!effectiveCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex flex-col" style={{ background: '#0f0c10' }}>
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
              <AdminToastProvider>{children}</AdminToastProvider>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
