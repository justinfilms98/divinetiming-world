# Typography System — Phase C

## Scale (single source of truth)

| Role | Token | Class | Use |
|------|--------|--------|-----|
| **Hero Title** | `--text-hero-title` | `.type-hero-title` | Hero headline (home, page heroes). Large, display font. |
| **Section Title** | `--text-h2` | `.type-h2` | Section H2 (e.g. "Booking inquiries"). |
| **Subheading** | `--text-h3` | `.type-h3` | Card titles, H3. |
| **Body** | `--text-body` | `.type-body` | Paragraphs, body copy. |
| **Caption** | `--text-small` / `--text-label` | `.type-small` / `.type-caption` | Labels, metadata, small copy. |

## Spacing rhythm (headings ↔ content)

- **Section title → content:** `mb-8 md:mb-10` (Section header).
- **Card title → body:** `mb-1` to `mb-2`.
- **Body → next section:** Section padding `py-12 md:py-16` handles vertical rhythm.

## Tokens in CSS

- Hero title: `clamp(2.5rem, 5vw, 4rem)` for full-screen hero; section heroes can use `--text-h1`.
- Section title: `var(--text-h2)` = clamp(1.75rem, 2vw, 2rem).
- Subheading: `var(--text-h3)`.
- Body: `var(--text-body)` (1.125rem / 1rem mobile).
- Caption: `var(--text-small)` (0.875rem) or `.type-caption` for muted labels.

All type classes live in `app/globals.css` and use design tokens from `:root`.
