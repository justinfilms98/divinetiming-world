# Layout System Audit — Charter Enforcement

## Components (exist and usage)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Container** | `components/ui/Container.tsx` | max-w-[1200px], mx-auto, px-5 md:px-8. Canonical content rail. |
| **Section** | `components/ui/Section.tsx` | py-12 md:py-16, optional title/subtitle. Vertical rhythm. |
| **Card** | `components/ui/Card.tsx` | Themed card wrapper (booking, event detail). |
| **Grid** | `components/ui/Grid.tsx` | Canonical grid: 1–4 cols, gap-6 md:gap-8. Use for product/gallery grids. |
| **PageShell** | `components/layout/PageShell.tsx` | Title + subtitle + actions + children. Default max-w-4xl. Used for **admin** and special flows (e.g. login); not used on standard public pages. |
| **PublicPageShell** | `components/layout/PublicPageShell.tsx` | Outer wrapper only (min-h-screen, max-w-[100vw], overflow-x-clip). Optional; public pages may use the same classes inline. |

## Public pages compliance

| Page | Container | Section | Card | Grid | Notes |
|------|-----------|---------|------|------|--------|
| `/` (home) | — | — | — | — | Hero + SignatureDivider only; no main rail (intentional). |
| `/events` | ✅ | ✅ | — | — | Section > Container. |
| `/events/[slug]` | ✅ | — | ✅ | — | Header removed; hero max-w-[1200px] + px; main in Container. |
| `/media` | ✅ | ✅ | — | — | Section > Container. |
| `/media/galleries/[slug]` | ✅ | — | — | — | Container wraps content. |
| `/shop` | ✅ (in client) | ✅ | — | — | Section > ShopPageClient > Container. |
| `/shop/[slug]` | — | — | — | — | Uses max-w-6xl; **consider Container** for consistency. |
| `/booking` | ✅ | ✅ | ✅ | — | Section > Container; Card for form and blocks. |
| `/about` | ✅ | — | — | — | Container wraps AboutContent. |
| `/presskit` | ✅ | — | — | — | Container > GlassPanel. |
| `/cart` | ✅ | — | — | — | Container wraps main. |

## Violations (fixed or remaining)

### Fixed this phase
- **events/[slug]** — Removed duplicate `Header`; hero wrapper set to `max-w-[1200px] mx-auto px-5 md:px-8` (canonical rail).
- **getEventBySlug** — Returns `null` for non-published events when `status` exists.

### Minor / optional
- **shop/[slug]** — Uses `max-w-6xl` for product layout. Acceptable for product detail; for strict charter alignment could wrap in Container (1200px).
- **PageShell** — Not used on public pages; public pages use Container + Section directly. No violation; PageShell is for admin/special.
- **Grid** — New component; not yet adopted everywhere. Shop grid and media gallery grid could switch to `<Grid cols={3}>` for consistency.

## Verification checklist

- [x] Hero center alignment: hero content uses `flex flex-col items-center justify-center text-center` and `mx-auto` where needed.
- [x] Corner nav: padding `px-5 md:px-8`; bar uses `.content-width` (1200px + margin auto).
- [x] Container max width: 1200px everywhere for main content.
- [x] Section padding: `Section` uses `py-12 md:py-16`; no ad-hoc section padding that conflicts.

## Components that violated (now fixed)

- `app/events/[slug]/page.tsx` — Used `Header` (duplicate nav) and `max-w-5xl` for hero. Fixed: Header removed; hero and main use canonical rail.
