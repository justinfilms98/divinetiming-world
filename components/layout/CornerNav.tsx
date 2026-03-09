'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlatformLinks, PlatformIcon } from '@/lib/platformLinks';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useScrollLock } from '@/lib/ui/useScrollLock';
import type { SiteSettings } from '@/lib/types/content';

const navItems = [
  { label: 'EVENTS', href: '/events' },
  { label: 'MEDIA', href: '/media' },
  { label: 'SHOP', href: '/shop' },
  { label: 'BOOKING', href: '/booking' },
];

const SCROLL_THRESHOLD = 80;
const MENU_DURATION = 0.28;
const MENU_EASE = [0.4, 0, 0.2, 1] as const;
const NAV_TRANSITION = 'color 200ms ease-out, opacity 200ms ease-out';

export function CornerNav({ siteSettings }: { siteSettings?: SiteSettings | null }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useScrollLock(isMobileMenuOpen);
  const panelRef = useFocusTrap(isMobileMenuOpen, closeMenu);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const duration = reducedMotion ? 0.01 : MENU_DURATION;
  const isHomePage = pathname === '/';
  const platformLinks = getPlatformLinks(siteSettings ?? undefined);

  const linkClass = (isActive: boolean) =>
    `relative text-sm uppercase font-medium tracking-[var(--letter-spacing-nav)] nav-link-underline
     ${isActive ? 'text-[var(--accent)] text-accent-active' : 'text-[var(--text)]/80 hover:text-[var(--text)]'}`;

  const linkClassOverHero = (isActive: boolean) =>
    `relative text-sm uppercase font-medium tracking-[var(--letter-spacing-nav)] nav-link-underline
     ${isActive ? 'text-[var(--accent)] text-accent-active' : 'text-white/85 hover:text-white'}`;

  return (
    <>
      {/* Desktop: Sticky bar when scrolled */}
      <AnimatePresence>
        {scrolled && (
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b pointer-events-auto"
            style={{
              background: 'var(--bg)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              borderBottomColor: 'rgba(198, 167, 94, 0.3)',
            }}
          >
            <nav className="content-width flex items-center justify-between h-16 px-6" style={{ transition: NAV_TRANSITION }}>
              <div className="flex items-center gap-8">
                {navItems.slice(0, 2).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(isActive)} style={{ transition: NAV_TRANSITION }}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <Link
                href="/"
                className="text-lg font-bold tracking-[0.12em] uppercase text-[var(--text)] hover:text-[var(--accent)]"
                style={{ fontFamily: 'var(--font-display)', transition: NAV_TRANSITION }}
              >
                DIVINE:TIMING
              </Link>
              <div className="flex items-center gap-8">
                {navItems.slice(2).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(isActive)} style={{ transition: NAV_TRANSITION }}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Desktop: Corner nav when at top (transparent over hero) */}
      <nav className="hidden md:block fixed inset-0 pointer-events-none z-50">
        {!isHomePage && !scrolled && (
          <motion.div
            className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto"
            initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.22, delay: reducedMotion ? 0 : 0.2 }}
          >
            <Link
              href="/"
              className="text-xl tracking-[0.12em] uppercase font-bold text-white/90 hover:text-white"
              style={{ fontFamily: 'var(--font-display)', transition: NAV_TRANSITION }}
            >
              DIVINE:TIMING
            </Link>
          </motion.div>
        )}

        {!scrolled && (
          <>
            <div className="absolute top-6 left-6 pointer-events-auto min-w-0 max-w-[calc(100vw-8rem)]" style={{ paddingLeft: 'env(safe-area-inset-left)' }}>
              <Link href={navItems[0]!.href} className={linkClassOverHero(pathname === navItems[0]!.href)} style={{ transition: NAV_TRANSITION }}>
                {navItems[0]!.label}
              </Link>
            </div>
            <div className="absolute top-6 right-6 pointer-events-auto min-w-0 max-w-[calc(100vw-8rem)]" style={{ paddingRight: 'env(safe-area-inset-right)' }}>
              <Link href={navItems[1]!.href} className={linkClassOverHero(pathname === navItems[1]!.href)} style={{ transition: NAV_TRANSITION }}>
                {navItems[1]!.label}
              </Link>
            </div>
            <div className="absolute bottom-6 left-6 pointer-events-auto min-w-0 max-w-[calc(100vw-8rem)]" style={{ paddingLeft: 'env(safe-area-inset-left)' }}>
              <Link href={navItems[2]!.href} className={linkClassOverHero(pathname === navItems[2]!.href)} style={{ transition: NAV_TRANSITION }}>
                {navItems[2]!.label}
              </Link>
            </div>
            <div className="absolute bottom-6 right-20 pointer-events-auto min-w-0 max-w-[calc(100vw-8rem)]" style={{ paddingRight: 'env(safe-area-inset-right)' }}>
              <Link href={navItems[3]!.href} className={linkClassOverHero(pathname === navItems[3]!.href)} style={{ transition: NAV_TRANSITION }}>
                {navItems[3]!.label}
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Mobile: logo + hamburger — safe area padding, no overflow */}
      <div className="md:hidden fixed top-6 left-6 z-50 min-w-0 max-w-[60vw]" style={{ paddingLeft: 'env(safe-area-inset-left)' }}>
        {!isHomePage && (
          <Link
            href="/"
            className="text-[var(--text)] font-bold text-base md:text-lg hover:text-[var(--accent)] truncate block"
            style={{ fontFamily: 'var(--font-display)', transition: NAV_TRANSITION }}
          >
            DIVINE:TIMING
          </Link>
        )}
      </div>

      <div className="md:hidden fixed top-6 right-6 z-50" style={{ paddingRight: 'env(safe-area-inset-right)' }}>
        <button
          ref={hamburgerRef}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 -m-3 text-[var(--text)]/80 hover:text-[var(--text)] min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg focus-ring"
          style={{ transition: NAV_TRANSITION }}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile: premium drawer overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              role="presentation"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={closeMenu}
              style={{ touchAction: 'none' }}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration, ease: MENU_EASE }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[85vw] max-w-[320px] overflow-x-clip overflow-y-auto md:hidden flex flex-col"
              style={{
                background: 'var(--bg)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                borderLeft: '1px solid rgba(198, 167, 94, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col flex-1 pt-6 pb-8 px-6 min-w-0">
                <div className="flex items-center justify-between mb-8">
                  <span
                    className="text-xs font-semibold tracking-[var(--letter-spacing-caps)] uppercase text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-ui)' }}
                  >
                    Menu
                  </span>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text)]/70 hover:text-[var(--text)] rounded-lg focus-ring"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="flex flex-col gap-1" aria-label="Main">
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className={`py-3 px-2 rounded-lg text-sm font-medium tracking-[var(--letter-spacing-nav)] uppercase transition-colors ${pathname === '/' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text)]/80 hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]/50'}`}
                    style={{ fontFamily: 'var(--font-ui)' }}
                  >
                    Home
                  </Link>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`py-3 px-2 rounded-lg text-sm font-medium tracking-[var(--letter-spacing-nav)] uppercase transition-colors ${isActive ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text)]/80 hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]/50'}`}
                        style={{ fontFamily: 'var(--font-ui)' }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {platformLinks.length > 0 && (
                  <>
                    <div className="my-6 border-t border-[var(--accent)]/20" />
                    <p className="text-[var(--text-muted)] text-xs font-semibold tracking-[var(--letter-spacing-caps)] uppercase mb-3 type-label">
                      Listen
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {platformLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-secondary)]/50 text-[var(--text)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/50 focus-ring"
                          style={{ transition: NAV_TRANSITION }}
                          aria-label={`Open ${link.label}`}
                        >
                          <PlatformIcon id={link.id} className="w-5 h-5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
