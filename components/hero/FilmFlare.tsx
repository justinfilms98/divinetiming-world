'use client';

/**
 * Film flare overlay between carousel transitions. Pure CSS gradient.
 * ~900ms duration, subtle and premium (no harsh white). Clip to prevent overflow.
 * Use rounded when hero section has rounded corners so flare doesn’t show square edges.
 */
const FLARE_DURATION_MS = 900;

export function FilmFlare({ active, rounded = true }: { active: boolean; rounded?: boolean }) {
  if (!active) return null;
  return (
    <div
      className={`absolute inset-0 z-10 pointer-events-none overflow-hidden ${rounded ? 'rounded-b-2xl' : ''}`}
      aria-hidden="true"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,255,255,0.22) 0%, transparent 55%),
          linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.04) 55%, transparent 100%)
        `,
        animation: `film-flare ${FLARE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
      }}
    />
  );
}
