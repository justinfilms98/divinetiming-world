'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--accent)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-[var(--text)] hover:text-[var(--accent)] transition-colors">
              DIVINE:TIMING
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/tour" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                Tour
              </Link>
              <Link href="/shop" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                Shop
              </Link>
              <Link href="/media" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                Media
              </Link>
              <Link href="/about" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                About
              </Link>
              <Link href="/booking" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                Booking
              </Link>
              <Link href="/presskit" className="text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                Press Kit
              </Link>
              <Link
                href="/booking"
                className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow"
              >
                Book Now
              </Link>
            </nav>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-[var(--text)] p-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden bg-[var(--bg)]"
          >
            <div className="flex flex-col h-full pt-20 px-6">
              <nav className="flex flex-col gap-6">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/tour"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Tour
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Shop
                </Link>
                <Link
                  href="/media"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Media
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/booking"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Booking
                </Link>
                <Link
                  href="/presskit"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  Press Kit
                </Link>

                <div className="pt-8 border-t border-[var(--accent)]/20">
                  <div className="flex gap-4 mb-6">
                    <a
                      href="https://www.instagram.com/divinetiming_ofc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://www.youtube.com/@divinetimingworld"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      YouTube
                    </a>
                    <a
                      href="https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      Spotify
                    </a>
                  </div>
                  <Link
                    href="/booking"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow text-center font-semibold"
                  >
                    Book Now
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
