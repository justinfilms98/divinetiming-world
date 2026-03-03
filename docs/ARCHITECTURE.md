# Architecture — Server / Client split

To avoid **"next/headers only works in Server Components"** and server-only code leaking into client bundles:

## Client components (`"use client"`)

**May import:**

- `@/lib/content/shared` — types, `parseYouTubeId`, `PAGE_SLUGS`, `MediaPageVideo`, `GalleryForHub`, etc.
- `@/lib/eventDetailHref` — pure `eventDetailHref(event)` for event detail links
- `@/lib/supabase/client` — browser Supabase client
- `@/lib/types/content` — TypeScript types only

**Must NOT import:**

- `@/lib/content/server` — server-only DB fetchers
- `@/lib/supabase/server` — uses `cookies()` from `next/headers`
- `@/lib/supabase/server-role` or `@/lib/supabase/service` or `@/lib/supabaseAdmin` — service role
- `@/lib/eventMedia` — uses `resolveMediaUrl` → server
- `@/lib/media/resolveMediaUrl` or `@/lib/mediaGallery` — server-only
- `next/headers`, `SUPABASE_SERVICE_ROLE_KEY` (in code that runs in client bundle)

## Server components and route handlers

**May import:**

- `@/lib/content/server` — `getHeroSection`, `getEvents`, `getGalleries`, etc.
- `@/lib/supabase/server` — session-based Supabase client
- `@/lib/supabase/server-role`, `@/lib/supabase/service`, `@/lib/supabaseAdmin` — when needed for admin/upload
- `@/lib/eventMedia`, `@/lib/mediaGallery`, `@/lib/media/resolveMediaUrl` — server-only resolvers

## Event link helper

- **Client** (e.g. `EventCard`): use `eventDetailHref` from `@/lib/eventDetailHref` only.
- **Server**: may still use `@/lib/eventMedia` (which re-exports `eventDetailHref`); do not import `eventMedia` in any `"use client"` file.

## Guardrails

Server-only modules use `import 'server-only';` at the top so accidental client imports fail at build. These include: `lib/supabase/server.ts`, `lib/content/server.ts`, `lib/eventMedia.ts`, `lib/mediaGallery.ts`, `lib/media/resolveMediaUrl.ts`, `lib/supabaseAdmin.ts`, `lib/supabase/server-role.ts`, `lib/supabase/service.ts`, `lib/admin/auth.ts`.
