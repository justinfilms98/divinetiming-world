'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Image as ImageIcon,
  Calendar,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  User,
  ExternalLink,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Site', href: '/admin/settings', icon: Settings, section: 'site' },
  { label: 'Pages', href: '/admin/pages', icon: FileText, section: 'content' },
  { label: 'Homepage', href: '/admin/homepage', icon: FileText, section: 'content' },
  { label: 'Heroes', href: '/admin/heroes', icon: FileText, section: 'content' },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Shop', href: '/admin/shop', icon: ShoppingBag },
  { label: 'Booking', href: '/admin/booking', icon: FileText, section: 'content' },
  { label: 'About', href: '/admin/about', icon: FileText, section: 'content' },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          paths: ['/', '/events', '/media', '/shop', '/booking', '/about'],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Published! Site cache revalidated.');
      } else {
        alert('Publish failed: ' + (data?.error || res.statusText));
      }
    } catch (e) {
      alert('Publish failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setPublishing(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="text-lg font-bold text-white tracking-tight">
          DIVINE:TIMING
        </Link>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="hidden md:flex p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 rounded-lg text-white/60 hover:text-white"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-white/70 hover:text-white hover:bg-white/5'}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop sidebar - collapsible */}
      <aside
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-full bg-[#0f0c10] border-r border-white/10 z-40
          transition-all duration-200 ease-out
          ${sidebarOpen ? 'w-56' : 'w-16'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 h-full w-64 bg-[#0f0c10] border-r border-white/10 z-50
          transform transition-transform duration-200
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          transition-all duration-200
          ${sidebarOpen ? 'md:ml-56' : 'md:ml-16'}
        `}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-[#0f0c10]/95 backdrop-blur-sm border-b border-white/10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-white/70 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 disabled:opacity-50 text-sm font-semibold transition-opacity"
            >
              <Zap className="w-4 h-4" />
              <span>Publish</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-3 border-l border-white/10 text-white/50 text-sm">
              <User className="w-4 h-4" />
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Uploadcare banner */}
        {typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY && (
          <div className="mx-4 md:mx-6 mt-3 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm">
            Uploads disabled: add{' '}
            <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY</code> to{' '}
            <code className="bg-white/10 px-1 rounded">.env.local</code>
          </div>
        )}

        {/* Page content - single scroll container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
