'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Calendar,
  Image as ImageIcon,
  ShoppingBag,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Mail,
  FileText,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Homepage', href: '/admin/homepage', icon: Home },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Shop', href: '/admin/shop', icon: ShoppingBag },
  { label: 'Booking', href: '/admin/booking', icon: Mail },
  { label: 'About', href: '/admin/about', icon: FileText },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Page Settings', href: '/admin/pages', icon: Settings },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always hidden by default, opens with hamburger */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0f0c10] border-r border-white/10 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">DIVINE:TIMING</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/50 mt-1">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors
                    ${
                      isActive
                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="w-full">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0f0c10]/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/70">
                <User className="w-4 h-4" />
                <span className="text-sm">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Centered */}
        <main className="p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
