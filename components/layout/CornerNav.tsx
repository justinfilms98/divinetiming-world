'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { getFooterLinks } from '@/lib/site/footerLinks';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useScrollLock } from '@/lib/ui/useScrollLock';
import { SpiralMark } from '@/components/brand/SpiralMark';
import { isNavItemActive, NAV_LEFT_COUNT, publicNavItems } from '@/lib/site/navigation';
import type { SiteSettings } from '@/lib/types/content';

const navItems = publicNavItems();
/** A seventh link needs a little less spacing to fit beside the logo on tablets. */
const NAV_GAP = navItems.length > 6 ? 'gap-4 lg:gap-8' : 'gap-8';
const LOGO_SIZE = navItems.length > 6 ? 'md:text-base lg:text-lg' : 'md:text-lg';

const MENU_DURATION = 0.28;
const MENU_EASE = [0.4, 0, 0.2, 1] as const;
const NAV_TRANSITION = 'color 200ms ease-out, opacity 200ms ease-out';

export function CornerNav({ siteSettings }: { siteSettings?: SiteSettings | null }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useScrollLock(isMobileMenuOpen);
  const panelRef = useFocusTrap(isMobileMenuOpen, closeMenu);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  const duration = reducedMotion ? 0.01 : MENU_DURATION;
  const socialLinks = getFooterLinks(siteSettings);

  const linkClass = (isActive: boolean) =>
    `relative inline-flex items-center min-h-[44px] text-sm uppercase font-medium tracking-[var(--letter-spacing-nav)] nav-link-underline
     ${isActive ? 'text-[var(--accent)] text-accent-active' : 'text-[var(--text)] hover:text-[var(--accent)]'}`;

  return (
    <>
      {/* Sticky top bar — always visible; hero/content sit below via PublicLayout spacer */}
      <header
        className="nav-black fixed top-0 left-0 right-0 z-50 border-b pointer-events-auto"
        style={{
          height: 'var(--public-nav-height)',
          paddingTop: 'env(safe-area-inset-top)',
          background: 'var(--bg)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          borderBottomColor: 'rgba(198, 167, 94, 0.25)',
        }}
      >
        <nav
          className="content-width grid grid-cols-[1fr_auto_1fr] md:flex md:items-center md:justify-between h-full px-5 md:px-8 items-center"
          style={{ transition: NAV_TRANSITION }}
          aria-label="Main"
        >
          {/* Mobile: balance hamburger so logo stays centered */}
          <div className="md:hidden w-11 shrink-0" aria-hidden />

          {/* Desktop: left nav links */}
          <div className={`hidden md:flex items-center ${NAV_GAP} min-w-0`}>
            {navItems.slice(0, NAV_LEFT_COUNT).map((item) => {
              const isActive = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${linkClass(isActive)} focus-ring rounded-sm`}
                  style={{ transition: NAV_TRANSITION }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Logo — centered on mobile via grid, centered on desktop via flex */}
          <Link
            href="/"
            className={`justify-self-center md:static inline-flex items-center min-h-[44px] gap-1.5 text-base ${LOGO_SIZE} font-bold tracking-[0.12em] uppercase text-[var(--text)] hover:text-[var(--accent)] truncate max-w-[52vw] md:max-w-none text-center focus-ring rounded-sm`}
            style={{ fontFamily: 'var(--font-display)', transition: NAV_TRANSITION }}
            aria-label="DIVINE:TIMING home"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <span>DIVINE</span>
            <SpiralMark size={14} className="shrink-0 text-[var(--accent)]" />
            <span>TIMING</span>
          </Link>

          {/* Desktop: right nav links */}
          <div className={`hidden md:flex items-center ${NAV_GAP} min-w-0 justify-end`}>
            {navItems.slice(NAV_LEFT_COUNT).map((item) => {
              const isActive = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${linkClass(isActive)} focus-ring rounded-sm`}
                  style={{ transition: NAV_TRANSITION }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile: hamburger */}
          <button
            ref={hamburgerRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden justify-self-end min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)]/80 focus-ring"
            style={{ transition: NAV_TRANSITION }}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </header>

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
              id="mobile-nav-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration, ease: MENU_EASE }}
              className="nav-black fixed top-0 right-0 bottom-0 z-[70] w-[85vw] max-w-[320px] overflow-x-clip overflow-y-auto md:hidden flex flex-col"
              style={{
                background: 'var(--bg)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
                borderLeft: '1px solid rgba(198, 167, 94, 0.25)',
                paddingTop: 'max(env(safe-area-inset-top), 0px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex flex-col flex-1 pt-6 px-6 min-w-0"
                style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
              >
                <div className="flex items-center justify-between mb-8">
                  <span
                    className="text-sm font-semibold tracking-[var(--letter-spacing-caps)] uppercase text-[var(--text-muted)]"
                    style={{ fontFamily: 'var(--font-ui)' }}
                  >
                    Menu
                  </span>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text)] hover:text-[var(--accent)] rounded-lg focus-ring"
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
                    className={`py-3.5 px-3 rounded-lg text-base font-semibold tracking-[var(--letter-spacing-nav)] uppercase transition-colors focus-ring ${pathname === '/' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)]/80'}`}
                    style={{ fontFamily: 'var(--font-ui)' }}
                    aria-current={pathname === '/' ? 'page' : undefined}
                  >
                    Home
                  </Link>
                  {navItems.map((item) => {
                    const isActive = isNavItemActive(item, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`py-3.5 px-3 rounded-lg text-base font-semibold tracking-[var(--letter-spacing-nav)] uppercase transition-colors focus-ring ${isActive ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)]/80'}`}
                        style={{ fontFamily: 'var(--font-ui)' }}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/contact"
                    onClick={closeMenu}
                    className={`py-3.5 px-3 rounded-lg text-base font-semibold tracking-[var(--letter-spacing-nav)] uppercase transition-colors focus-ring ${pathname === '/contact' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)]/80'}`}
                    style={{ fontFamily: 'var(--font-ui)' }}
                    aria-current={pathname === '/contact' ? 'page' : undefined}
                  >
                    Contact
                  </Link>
                </nav>

                {socialLinks.length > 0 && (
                  <>
                    <div className="my-6 border-t border-[var(--accent)]/20" />
                    <p className="text-[var(--text-muted)] text-sm font-semibold tracking-[var(--letter-spacing-caps)] uppercase mb-3 type-label">
                      Connect
                    </p>
                    <SocialLinks links={socialLinks} onNavigate={closeMenu} />
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

/** Reserves space below the fixed sticky nav (safe-area aware). */
export function PublicNavSpacer() {
  return (
    <div
      className="shrink-0 w-full"
      style={{ height: 'calc(var(--public-nav-height) + env(safe-area-inset-top, 0px))' }}
      aria-hidden
    />
  );
}
