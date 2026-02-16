/**
 * Luxury design tokens — single source of truth for spacing, radius, shadows, typography.
 * Uses existing brand palette (--bg, --accent, --text, etc.) from globals.css.
 */

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.2)',
  md: '0 4px 12px rgba(0,0,0,0.25)',
  lg: '0 8px 24px rgba(0,0,0,0.3)',
  xl: '0 16px 48px rgba(0,0,0,0.35)',
  glow: '0 0 20px rgba(209, 98, 23, 0.3)',
  glowHover: '0 0 30px rgba(209, 98, 23, 0.5)',
  inner: 'inset 0 1px 0 rgba(255,255,255,0.05)',
} as const;

export const borders = {
  thin: '1px solid rgba(255,255,255,0.1)',
  hairline: '1px solid rgba(255,255,255,0.06)',
  accent: '1px solid rgba(209, 98, 23, 0.4)',
  accentHover: '1px solid rgba(209, 98, 23, 0.6)',
} as const;

export const blur = {
  sm: 'blur(8px)',
  md: 'blur(12px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)',
  glass: 'blur(12px)',
  glassStrong: 'blur(20px)',
} as const;

export const transition = {
  fast: '150ms ease',
  med: '250ms ease',
  slow: '400ms ease',
  easeOut: '300ms cubic-bezier(0.33, 1, 0.68, 1)',
  emphasize: '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const typography = {
  xs: { size: '0.75rem', lineHeight: '1.25', letterSpacing: '0.02em' },
  sm: { size: '0.875rem', lineHeight: '1.4', letterSpacing: '0.01em' },
  base: { size: '1rem', lineHeight: '1.6', letterSpacing: '0' },
  lg: { size: '1.125rem', lineHeight: '1.5', letterSpacing: '-0.01em' },
  xl: { size: '1.25rem', lineHeight: '1.4', letterSpacing: '-0.02em' },
  '2xl': { size: '1.5rem', lineHeight: '1.3', letterSpacing: '-0.02em' },
  '3xl': { size: '1.875rem', lineHeight: '1.25', letterSpacing: '-0.03em' },
  '4xl': { size: '2.25rem', lineHeight: '1.2', letterSpacing: '-0.03em' },
  '5xl': { size: '3rem', lineHeight: '1.15', letterSpacing: '-0.04em' },
  '6xl': { size: '3.75rem', lineHeight: '1.1', letterSpacing: '-0.04em' },
  '7xl': { size: '4.5rem', lineHeight: '1.05', letterSpacing: '-0.05em' },
} as const;

/** Tailwind-compatible class hints (use with style or arbitrary values in TW) */
export const tokenClasses = {
  radius: {
    sm: 'rounded-[4px]',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  },
  transition: 'transition-all duration-300 ease-out',
  transitionFast: 'transition-all duration-150 ease-out',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg',
  luxuryCard: 'bg-white/5 border border-white/10 rounded-2xl shadow-md hover:border-white/20 hover:shadow-lg transition-all duration-300',
} as const;
