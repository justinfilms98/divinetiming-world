'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[var(--bg2)] border-t border-[var(--accent)]/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-4">DIVINE:TIMING</h3>
            <p className="text-[var(--text)]/70 text-sm">
              Live, evolving, in motion.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text)] mb-4 uppercase tracking-wide">Connect</h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.instagram.com/divinetiming_ofc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/@divinetimingworld"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm"
              >
                YouTube
              </a>
              <a
                href="https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm"
              >
                Spotify
              </a>
              <a
                href="https://music.apple.com/es/artist/divine-timing/1851580045"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm"
              >
                Apple Music
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text)] mb-4 uppercase tracking-wide">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link href="/events" className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm">
                Events
              </Link>
              <Link href="/shop" className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm">
                Shop
              </Link>
              <Link href="/booking" className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm">
                Booking
              </Link>
              <Link href="/presskit" className="text-[var(--text)]/70 hover:text-[var(--accent)] transition-colors text-sm">
                Press Kit
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--accent)]/20 text-center text-[var(--text)]/50 text-sm">
          <p>&copy; {new Date().getFullYear()} DIVINE:TIMING. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
