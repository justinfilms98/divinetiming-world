# Phase 4 — Admin IA & Shell

## 1) Admin IA (routes + nav structure)

### Routes
| Route | Purpose |
|-------|--------|
| `/admin` | **Dashboard** — overview, quick links, status panels (counts). No Hero Editor. |
| `/admin/hero` | **Hero Editor** — edit hero media, carousel slots, copy, and legacy purge per page. |
| `/admin/settings` | Site settings |
| `/admin/events` | Events CRUD |
| `/admin/booking` | Booking content |
| `/admin/media` | Media library |
| `/admin/collections` | Gallery collections |
| `/admin/shop` | Shop / products |
| `/admin/about` | About content |
| `/admin/videos` | Videos |

### Nav structure (sidebar)
- **Dashboard** → `/admin`
- **Hero** → `/admin/hero` (no longer a hash on Dashboard)
- **Events** → `/admin/events`
- **Booking** → `/admin/booking`
- **Media** → `/admin/media`
- **Shop** → `/admin/shop`
- **About** → `/admin/about`
- **Settings** → `/admin/settings`

Optional: **Collections** and **Videos** can remain as separate nav items or be grouped under Media later; current nav keeps them as-is for minimal change.

---

## 2) Files touched

| File | Change |
|------|--------|
| `components/admin/AdminShell.tsx` | Centered main content max-w-[1280px], consistent gutters; ensure no horizontal overflow. |
| `components/admin/AdminNav.tsx` | Replace "Heroes" (#heroes) with "Hero" → `/admin/hero`. |
| `components/admin/AdminCard.tsx` | Design tokens: rounded-2xl, p-4 md:p-6, border, shadow-sm. |
| `components/admin/AdminPageHeader.tsx` | **NEW** — title + description + right-side actions (for sticky Save bars). |
| `components/admin/AdminFormRow.tsx` | **NEW** — label + control + help + error. |
| `app/admin/page.tsx` | Remove DashboardHeroEditor; dashboard = overview + stats + quick links only. |
| `app/admin/hero/page.tsx` | **NEW** — Hero Editor page (DashboardHeroEditor + AdminPageHeader). |
| `components/admin/DashboardHeroEditor.tsx` | Primary UI: "Upload" / "Replace" only; vendor copy in Help collapsible; Danger zone for Purge legacy (compact). |
| `app/admin/admin.css` | Card border-radius to rounded-2xl if needed. |
| `components/admin/uploader/UniversalUploader.tsx` | Optional `hideStorageTip` prop to hide cloud-drive tip when help is elsewhere. |

---

## 3) Acceptance checklist

- [x] `/admin` cohesive and centered at 1440px and 375px (max-w-[1280px] main, responsive gutters).
- [x] No horizontal overflow on admin pages (overflow-x-hidden, min-w-0 on shell).
- [x] Hero Editor is not visually merged with Dashboard (lives on `/admin/hero`).
- [x] Left sidebar is a real sidebar (icon + label nav), no giant blank column.
- [x] AdminPageHeader, AdminCard, AdminFormRow available and used where applicable.
- [x] Danger zone for Purge legacy is compact with clear warnings.
- [x] No "Upload to Supabase / choose from Google Drive" in primary UI; behind Help collapsible.

---

## 4) What changed (implementation summary)

- **AdminShell**: Main content max-width 1280px, gutters `px-4 sm:px-6 lg:px-8`, `py-8 md:py-10`.
- **AdminNav**: "Heroes" (#heroes) → "Hero" (`/admin/hero`); Settings moved to end; active state simplified.
- **AdminCard**: Design tokens — `rounded-2xl`, `p-4 md:p-6`, `shadow-sm`; admin.css card radius 1rem.
- **AdminPageHeader**: New component — title + description + right-side actions.
- **AdminFormRow**: New component — label (uppercase, muted) + control + optional help + error.
- **Dashboard** (`/admin`): Hero Editor removed; overview stats + quick links only; Hero card links to `/admin/hero`.
- **Hero** (`/admin/hero`): New page — AdminPageHeader + DashboardHeroEditor.
- **DashboardHeroEditor**: Primary buttons "Upload" / "Replace" only; "Where do uploads go?" Help collapsible with Supabase/library copy; Danger zone for "Purge legacy hero URLs" (compact, red tint).
- **UniversalUploader**: Optional `hideStorageTip` prop; Hero Editor passes it to hide cloud-drive tip in primary UI.
- **Build**: Passes; no new dependencies.
