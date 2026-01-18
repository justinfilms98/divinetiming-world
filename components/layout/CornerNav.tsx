'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'TOUR', href: '/tour', position: 'top-left' },
  { label: 'MEDIA', href: '/media', position: 'top-right' },
  { label: 'SHOP', href: '/shop', position: 'bottom-left' },
  { label: 'BOOKING', href: '/booking', position: 'bottom-right' },
];

export function CornerNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomePage = pathname === '/';

  return (
    <>
      {/* Desktop Corner Navigation */}
      <nav className="hidden md:block fixed inset-0 pointer-events-none z-50">
        {/* Home Logo/Button - Center Top (only show when not on home page) */}
        {!isHomePage && (
          <motion.div
            className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/"
              className="
                text-xl tracking-[0.1em] uppercase font-bold
                transition-all duration-300
                text-white/90 hover:text-white
                hover:drop-shadow-[0_0_8px_rgba(209,98,23,0.6)]
              "
            >
              DIVINE:TIMING
            </Link>
          </motion.div>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const positionClasses = {
            'top-left': 'top-6 left-6',
            'top-right': 'top-6 right-6',
            'bottom-left': 'bottom-6 left-6',
            'bottom-right': 'bottom-6 right-6',
          };

          return (
            <motion.div
              key={item.href}
              className={`absolute ${positionClasses[item.position as keyof typeof positionClasses]} pointer-events-auto`}
              initial={{ opacity: 0, y: item.position.includes('top') ? -20 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href={item.href}
                className={`
                  text-sm tracking-[0.2em] uppercase font-medium
                  transition-all duration-300
                  ${isActive ? 'text-[var(--accent)]' : 'text-white/80 hover:text-white'}
                  hover:drop-shadow-[0_0_8px_rgba(209,98,23,0.6)]
                `}
              >
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-6 left-6 z-50">
        {!isHomePage && (
          <Link
            href="/"
            className="text-white/90 hover:text-white transition-colors font-bold text-lg mb-4 block"
          >
            DIVINE:TIMING
          </Link>
        )}
      </div>

      <div className="md:hidden fixed top-6 right-6 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-10 right-0 bg-[var(--bg)]/95 backdrop-blur-md border border-white/10 rounded-lg p-4 min-w-[200px]"
          >
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                block py-2 text-sm tracking-[0.2em] uppercase font-medium
                transition-colors mb-2
                ${pathname === '/' ? 'text-[var(--accent)]' : 'text-white/80 hover:text-white'}
              `}
            >
              HOME
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block py-2 text-sm tracking-[0.2em] uppercase font-medium
                  transition-colors
                  ${pathname === item.href ? 'text-[var(--accent)]' : 'text-white/80 hover:text-white'}
                `}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
