'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface HeroSectionProps {
  settings: any;
}

export function HeroSection({ settings }: HeroSectionProps) {
  // Determine hero media
  const heroMediaUrl = settings?.hero_media_url;
  const heroMediaType = settings?.hero_media_type || 'default';
  const useVideo = heroMediaType === 'video' && heroMediaUrl;
  const useImage = heroMediaType === 'image' && heroMediaUrl;
  const useDefault = !useVideo && !useImage;

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Media */}
      {useVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroMediaUrl} type="video/mp4" />
        </video>
      )}

      {useImage && (
        <Image
          src={heroMediaUrl}
          alt="DIVINE:TIMING"
          fill
          className="object-cover"
          priority
        />
      )}

      {useDefault && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[var(--bg2)] to-[var(--bg)]">
          {/* Fallback gradient if image doesn't exist */}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-[var(--bg)]/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold text-[var(--text)] mb-4"
        >
          {settings?.artist_name || 'DIVINE:TIMING'}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          <Link
            href="https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[var(--accent)] text-[var(--bg)] rounded-md hover:bg-[var(--accent2)] transition-colors glow font-semibold"
          >
            Listen
          </Link>
          <Link
            href="/tour"
            className="px-6 py-3 bg-transparent border-2 border-[var(--accent)] text-[var(--text)] rounded-md hover:bg-[var(--accent)]/20 transition-colors font-semibold"
          >
            Tour Dates
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-transparent border-2 border-[var(--accent)] text-[var(--text)] rounded-md hover:bg-[var(--accent)]/20 transition-colors font-semibold"
          >
            Shop
          </Link>
          <Link
            href="/booking"
            className="px-6 py-3 bg-transparent border-2 border-[var(--accent)] text-[var(--text)] rounded-md hover:bg-[var(--accent)]/20 transition-colors font-semibold"
          >
            Book Us
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
