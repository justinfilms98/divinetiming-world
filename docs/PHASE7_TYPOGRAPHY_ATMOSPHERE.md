# Phase 7 — Typography & Atmosphere Polish

## Goal
Elevate from “clean website” to **luxury brand experience** via typography, hero atmosphere, subtle texture, and color harmony. No layout redesign.

---

## 1) Files modified

| File | Change |
|------|--------|
| `app/globals.css` | Typography tokens (--letter-spacing-hero-title, --letter-spacing-hero-label, --line-height-body 1.65); .type-hero-label; .hero-grain; hero CTA transitions 150–200ms, hover brightness + shadow only (no translateY); --white-soft; .glow transition 0.18s. |
| `components/home/DivineTimingIntro.tsx` | Hero title: font-semibold, letter-spacing var(--letter-spacing-hero-title), color var(--white-soft). |
| `components/home/HeroContent.tsx` | Eyebrow uses .type-hero-label. |
| `app/page.tsx` | Home hero label uses .type-hero-label text-white. |
| `components/hero/UnifiedHero.tsx` | Overlay: from-transparent to-black/35; radial softened; .hero-grain layer; badge .type-hero-label; headline font-semibold + letter-spacing; subtext white/90, leading-relaxed. |
| `components/hero/HeroCarouselV2.tsx` | Same overlay gradient + .hero-grain. |

---

## 2) Visual improvements

### 7.1 Typography
- **Hero title (DIVINE:TIMING):** Letter-spacing 0.06em (--letter-spacing-hero-title), font-semibold (no heavy bold), color var(--white-soft) for a slightly softened white.
- **Hero label (small caps):** New .type-hero-label — opacity 0.75, letter-spacing 0.18em; used on home label and UnifiedHero badge.
- **Body:** --line-height-body set to 1.65 for more air; --line-height-relaxed 1.75.
- **UnifiedHero headline:** font-semibold, letter-spacing hero-title; subtext leading-relaxed, white/90.

### 7.2 Hero atmosphere
- **Overlay:** Gradient changed to top transparent → bottom rgba(0,0,0,0.35) for readability without heavy darkening. Radial vignette softened (0.25 instead of 0.35).
- Applied in both UnifiedHero and HeroCarouselV2.

### 7.3 Film grain
- **.hero-grain:** Absolute layer with SVG feTurbulence noise at 3% opacity, mix-blend-mode overlay. Added to UnifiedHero and HeroCarouselV2. Very subtle, cinematic.

### 7.4 Color harmony
- **--white-soft:** rgba(255,255,255,0.96) for hero title (softer than pure white).
- Hero secondary CTA uses rgba(255,255,255,0.95) and 0.98 on hover. No new palette colors; existing gold/accents unchanged.

### 7.5 Button polish
- **Hero CTAs:** Transition 0.18s ease-out; hover uses brightness(1.05) and shadow only (no translateY/scale). Active state brightness(0.98).
- **.glow / .btn-primary-glow:** box-shadow transition 0.18s ease-out.

---

## 3) Acceptance checklist

- [x] Typography feels more spacious and refined (hero title/label tokens, body line-height).
- [x] Hero text readability improved without losing video atmosphere (subtle bottom gradient).
- [x] Film grain is subtle and cinematic (3% overlay on hero).
- [x] Colors balanced: softened white on hero title; gold/accents unchanged.
- [x] Buttons premium and restrained: 150–200ms, brightness + shadow, no scale/lift on hero CTAs.
- [x] Build passes.
