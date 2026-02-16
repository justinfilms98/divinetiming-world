'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogOut, ExternalLink } from 'lucide-react';
import '@/app/admin/admin.css';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
    <div className="admin-root min-h-screen w-full overflow-x-hidden">
      <div className="grid grid-cols-[240px_1fr] min-h-screen">
        {/* Sidebar: fixed width, no shrink */}
        <aside className="admin-sidebar w-[240px] shrink-0 flex flex-col border-r border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <Link
              href="/admin"
              className="text-lg font-bold text-slate-800 tracking-tight"
            >
              Admin
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AdminNav />
          </div>
          <div className="p-3 border-t border-slate-200">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              View site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm font-medium mt-0.5"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main: min-w-0 to prevent overflow */}
        <div className="min-w-0 flex flex-col">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
