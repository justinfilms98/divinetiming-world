# Phase 10 — Events Storytelling Layout

## Goal
Transform event pages into **immersive event detail experiences**: cinematic event landing pages, not blog posts. Minimal UI, strong storytelling.

---

## 1) Files modified

| File | Change |
|------|--------|
| `app/events/[slug]/page.tsx` | **10.1** Two-column layout: `grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12`, container `max-w-[1200px]`. Left column: optional image, event description (story). Right column: `EventDetailCard`. **10.4** Description: `max-w-[65ch] leading-relaxed space-y-6`, paragraphs split by double newline. |
| `components/events/EventDetailCard.tsx` | **New.** **10.2** Event card (ticket panel): `rounded-xl`, `border border-[var(--accent)]/20`, `shadow-[var(--shadow-card)]`, `p-6`, `lg:sticky lg:top-24`. Content order: Date, Time, Venue, Location (city), Get Tickets CTA, Share (copy link). **10.3** Metadata rows: icon + label + value (Calendar, Clock, Building2, MapPin from lucide-react). **10.5** CTA: `hover:brightness-[1.08] hover:shadow-[var(--shadow-button-hover)]`, 200ms, no scale. |

---

## 2) Layout improvements

### 10.1 Event page structure
- **Hero** (unchanged): event image or events hero, title as headline, venue · city as subtext.
- **Content section:** Back link, then two-column grid.
  - **Desktop:** `grid-cols-[2fr_1fr] gap-12`, max width `max-w-[1200px]`.
  - **Mobile:** Single column, stack vertically (card below story).
- **Left column (story):** Optional event image (above fold, max-w-[65ch]), then event description with editorial typography. No heavy card stacking.
- **Right column:** Sticky event card (ticket panel) with metadata and CTA.

### 10.2 Event card design
- **Panel style:** `rounded-xl`, subtle border (`border-[var(--accent)]/20`), soft shadow (`--shadow-card`), calm padding (`p-6`).
- **Content order:** Date → Time (if set) → Venue → Location (city) → Get Tickets button → Share (copy link).
- **CTA:** Primary button, full width in card, clear hierarchy.

### 10.3 Event metadata styling
- **Pattern:** Icon (accent color) + label (uppercase, muted, small) + value (font-medium).
- **Icons:** Calendar (date), Clock (time), Building2 (venue), MapPin (city). No heavy card stacking; single card with spaced rows.

### 10.4 Event description layout
- **Max line length:** `max-w-[65ch]` for readable measure.
- **Line height:** `leading-relaxed`.
- **Section spacing:** `space-y-6`; description split by `\n\n` into paragraphs.
- **Color:** `text-[var(--text)]` on page background.

### 10.5 Ticket CTA emphasis
- **Interaction:** `hover:brightness-[1.08]` and `hover:shadow-[var(--shadow-button-hover)]`, transition 200ms. No scale or bounce.
- **Focus:** Visible ring for accessibility.

---

## 3) Acceptance checklist

- [x] Event detail page uses two-column layout on desktop (`2fr 1fr`, gap-12).
- [x] Event metadata is clear and structured (icon + label + value).
- [x] Ticket CTA stands out without feeling flashy (brightness + soft glow, no scale).
- [x] Event description is readable and well spaced (65ch, leading-relaxed, space-y-6).
- [x] Layout collapses cleanly on mobile (single column).
- [x] Build passes.
