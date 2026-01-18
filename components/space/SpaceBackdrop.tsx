'use client';

import { useEffect, useState } from 'react';

interface Star {
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Meteor {
  left: number;
  delay: number;
  duration: number;
}

export function SpaceBackdrop() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Generate stars only on client
    if (!mediaQuery.matches) {
      const generatedStars: Star[] = Array.from({ length: 100 }).map(() => ({
        size: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
      }));

      const generatedMeteors: Meteor[] = Array.from({ length: 3 }).map(() => ({
        left: 10 + Math.random() * 80,
        delay: Math.random() * 20,
        duration: 3 + Math.random() * 2,
      }));

      setStars(generatedStars);
      setMeteors(generatedMeteors);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#1a0f1f] to-[#0f0c10]" />

      {/* Stars layer - only render after mount to avoid hydration mismatch */}
      {mounted && !reducedMotion && (
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Meteors layer - only render after mount */}
      {mounted && !reducedMotion && (
        <div className="absolute inset-0">
          {meteors.map((meteor, i) => (
            <div
              key={i}
              className="absolute top-0 h-1 w-1 rounded-full bg-white shadow-lg"
              style={{
                left: `${meteor.left}%`,
                boxShadow: '0 0 10px 2px rgba(255,255,255,0.5)',
                animation: `meteor ${meteor.duration}s linear ${meteor.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

    </div>
  );
}
