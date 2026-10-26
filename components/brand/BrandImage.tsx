import { TRIBAL_SPIRAL_PATH } from '@/components/brand/tribalSpiralPath';

export const BRAND_GOLD = '#C6A75E';
export const BRAND_NIGHT = '#0B0B0C';

/** Spiral mark as plain SVG for next/og ImageResponse (no CSS classes or client code). */
export function SpiralSvg({ size, strokeWidth = 3.2 }: { size: number; strokeWidth?: number }) {
  return (
    // Path bounds are ~14.7–92.1 × 11.3–92.5; offset the viewBox so the mark is optically centred.
    <svg width={size} height={size} viewBox="3.4 1.9 100 100">
      <path
        d={TRIBAL_SPIRAL_PATH}
        fill="none"
        stroke={BRAND_GOLD}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Square app icon: spiral centred on night background. */
export function BrandIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_NIGHT,
      }}
    >
      {/* Thicker stroke keeps the spiral legible at 16–32px. */}
      <SpiralSvg size={Math.round(size * 0.86)} strokeWidth={size <= 64 ? 6 : 4} />
    </div>
  );
}

/** 1200×630 social share card. */
export function BrandShareCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_NIGHT,
        color: BRAND_GOLD,
      }}
    >
      <SpiralSvg size={260} strokeWidth={3} />
      <div style={{ marginTop: 40, fontSize: 72, letterSpacing: 18, fontWeight: 600 }}>DIVINE:TIMING</div>
      <div style={{ marginTop: 16, fontSize: 28, letterSpacing: 6, color: '#E8DCC0', opacity: 0.8 }}>
        Live, evolving, in motion.
      </div>
    </div>
  );
}
