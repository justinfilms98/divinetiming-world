# Bandwidth optimization and release preparation (2026-10-26, evening)

Nothing here is deployed to production. Production still runs `main` 303fa92.

## 1. Standalone hero-carousel release (`fix/hero-carousel`, preview `k6qhsbxu9`)

**Contents:** exactly four files — `components/hero/UnifiedHero.tsx`,
`components/ui/MediaAssetRenderer.tsx`, `lib/hero/heroCarousel.ts` and its test. No migrations, API
routes, database writes, storage changes, auth or RLS changes. Other users of `MediaAssetRenderer`
(page headers, event cards, press kit) do not pass the new props, so they keep the defaults
(autoplay + loop) and behave as before.

**Final playback check** (local build of the release, all media served from local fixture copies):

| Case | Result |
|---|---|
| Phone, normal connection | 0→1→2→0, two full loops in 70 s, 1 video at a time, no tap-to-play button |
| Desktop, normal connection | Same |
| Loops re-download? | No: each file downloads once (~60 MB total), second loop replays from memory |
| Phone, Slow 4G (1.6 Mbit/s) | Never stuck; clips mostly stall and are skipped by the 8 s watchdog (20 MB files are too heavy) |
| Reduced motion | Advances with instant cuts |
| A clip fails | Skipped (0→2→0) |

**Unresolved risks:** 20 MB originals on cellular (fixed by the renditions release); not yet seen on a
real iPhone/Android; if *every* hero file fails, slides show the generic "Media unavailable" panel
rather than the branded background.

## 2. Optimized hero copies (`feat/hero-renditions`, preview after `1918d8d`)

Twelve **new** files in `media/hero/optimized/` (31 MB). The three originals are unchanged (same size,
ETag and dates before/after). No database records changed: the preview maps each original URL to
its copies in code (`lib/media/heroRenditions.ts`), so production keeps playing the originals until
this branch is deployed, and rolling back is a redeploy.

| Clip | Original (2560×1440, 15.7 Mbit/s, audio, moov at end) | 1080p desktop | 720p phone | Posters 1920 / 1280 |
|---|---|---|---|---|
| 1 | 19.9 MB | 6.8 MB · VMAF 95.1 | 3.1 MB · VMAF 88.7 | 62 / 37 KB |
| 2 | 19.7 MB | 7.4 MB · VMAF 95.6 | 3.4 MB · VMAF 89.1 | 39 / 23 KB |
| 3 | 20.0 MB | 6.9 MB · VMAF 94.0 | 3.1 MB · VMAF 87.3 | 70 / 41 KB |

Encoding: H.264 High, `veryslow`/`film`, CRF 20 (1080p, ≤6 Mbit/s) / CRF 22 (720p, ≤2.8 Mbit/s),
2 s keyframes, BT.709 tags, `faststart`, audio removed (the hero is always muted), aspect ratio
kept (1920×1082 / 1920×1080 / 1920×1076). VMAF is measured against the original on a 1920×1080 grid
(≥93 ≈ visually identical at desktop size). At phone size, frame-exact crops of original / 1080p /
720p are visually indistinguishable (`C:\Users\justi\dt-visual\renditions\`). Posters are the first
frame, so the poster→video handoff is seamless.

**Player behaviour:** viewport <768 px → 720p, otherwise 1080p; Data Saver or a reported 3G/2G
connection → poster carousel only. Until the browser has chosen, the page shows the poster (no
`<video>` in the server HTML), so no clip downloads before the choice. On a slow link the clip
holds once until it can play through instead of stuttering. The browser's `downlink` estimate is
ignored (a fresh browser reports ~1.5 Mbit/s on any line).

**Tests (local fixtures only; no Supabase bandwidth):**

| Case | First moving frame | Buffering events | Data |
|---|---|---|---|
| Phone, normal | 1.8 s | 5 | 10 MB per loop (originals: 62 MB) |
| Desktop, Fast 4G (9 Mbit/s) | 2.8 s | 4 | 21.8 MB per loop (originals: 60 MB) |
| Phone, Slow 4G (1.6 Mbit/s) | 11.8 s (poster until then) | 4 (was 50 before the hold) | 9.4 MB |
| Phone, Slow 4G, originals for comparison | 51 s | — | mostly skipped |
| Phone reporting 3G | poster carousel, no video | 0 | 0.1 MB |
| Phone, Slow 3G (0.4 Mbit/s), no connection info (Safari-like) | 59 s; posters cycle meanwhile | 5 | 3 MB in 75 s |
| Reduced motion / missing clip | advances / clip skipped | — | — |

Deployed preview (`jdsk5cqhu`) re-checked on phone and desktop with fixtures: same behaviour.

## 3. Caching

| Media | Path | Cache today | Safe long cache? |
|---|---|---|---|
| New hero copies | `hero/optimized/<name>-<content hash>` | `public, max-age=31536000`, CDN HIT (verified) | Yes: content-hashed, never overwritten (`upsert: false`) |
| Hero originals | `library/<timestamp>-…` | `max-age=undefined` / `no-cache` | Unchanged (left as is) |
| Library uploads | `library/<timestamp>-…` | `max-age=undefined` (signed upload sets none) | Yes, unique per upload — proposed: 1 year + `upsert: false` |
| Hero slot uploads | `hero/<page>/slot-N/<timestamp>-…` | 1 hour | Yes, unique per upload |
| Page header images and logos | `hero/<page>.jpg`, `hero/logos/<page>-logo.*` | 1 hour | **No:** overwritten in place. Keep short, or switch to versioned names first |

Rule: long-lived caching only for URLs that never change content. Replacement always produces a new
URL, and the page (rendered from the database) points to the new URL, so visitors never see stale
media. Vercel's image optimizer re-fetches the full original on every cache miss (see §4), so its
cache lifetime can be raised only after page-header images use versioned names.

## 4. Supabase usage and cost

**Verified (Supabase docs and this project):**

| | Free (current) | Pro |
|---|---|---|
| Price | $0 | $25/month (includes $10 compute credit covering this project's size) |
| Egress | 5 GB uncached + 5 GB cached / month | 250 GB + 250 GB, then $0.09 / $0.03 per GB |
| Storage | 1 GB | 100 GB, then $0.0213/GB |
| Max file | 50 MB | up to 500 GB |
| Over quota | Notification → grace period → restrictions (project pause, read-only DB, or HTTP 402 on all API requests) | Spend cap on by default (same restrictions if exceeded) |

Storage used now: ~366 MB of 1 GB (335 MB + 31 MB of new copies).

Last 24 hours of logs (upper bound: sizes of responses served, some aborted early):
real visitors 50 browsers → **2.6 GB video + 0.8 GB images**; my automated testing → 12.5 GB
(one-off; future tests use local copies). Of the image traffic, ~0.45 GB came from an old preview link
loading a 37 MB photo directly, and ~0.37 GB from Vercel's image optimizer fetching 32 MB originals.

**Not verified:** billing-cycle usage, cycle dates, and whether a quota notice has been sent (the
dashboard needs a Supabase sign-in). Restrictions are only applied after a notification and grace
period, so check the billing email and *Organization → Usage*.

**Estimates (not measured):**

| Scenario | Video / month at ~50 visitors/day | Notes |
|---|---|---|
| Today's live site | ~40–80 GB | all three 20 MB clips per visit |
| Carousel fix only | ~25–45 GB | one clip at a time; loops reuse memory |
| Carousel fix + optimized copies | **~6–15 GB** | ~3–10 MB per visit; repeat visits cached by the browser for a year |
| Images (until web-size image copies exist) | ~5–20 GB | 32–37 MB originals fetched per optimizer cache miss |

Even optimized, total egress at this traffic is likely **above the Free plan's 10 GB** and far
below Pro's 500 GB.

| Option | Monthly cost | Pros | Cons |
|---|---|---|---|
| Stay on Free | $0 | No change | Probably over quota at current traffic → risk of restrictions that would break the whole site (402s), 50 MB file cap, 1 GB storage |
| Supabase Pro | $25 | Simplest; removes egress, storage and file-size limits; no project pausing | Recurring cost |
| Video CDN, Supabase stays Free | ~$0–2 (estimate) | Bunny CDN $0.01/GB NA/EU, $1 minimum; Cloudflare R2 storage $0.015/GB-month, 10 GB free, no egress fees (verified list prices) | New account; hero copies uploaded there; R2 production use needs a custom domain (a DNS change) |

## 5. Migration 058 review

Changes only column defaults: `events.status`, `galleries.status`, `products.status` → `draft`;
`products.is_active` → `false`; `external_media_assets.usage_type` → `internal`. No row is updated.
Dry-run inside a rolled-back transaction confirmed the new defaults and unchanged counts (7 events,
0 published events, 1 published product, 11 public media records). The events, collections and
products routes always set an explicit status, so for them 058 is only a backstop. One behaviour
change: Google Drive imports omit `usage_type`, so after 058 they start Internal (no Drive imports
exist today). Down migration restores the old defaults.

## 6. Automatic media optimization — browser evaluation (before implementation)

| Topic | Finding | Design response |
|---|---|---|
| Hardware video encoding (WebCodecs) | Chrome/Edge 94+ (desktop, Android), Safari 16.4+ (macOS and iOS) | Primary path; check `VideoEncoder.isConfigSupported` first |
| Audio | Re-encoding audio needs `AudioEncoder` (newer Safari only) | Hero: drop audio. Library videos: copy the original audio track without re-encoding |
| iPhone source footage | HEVC, often 4K and **HDR (Dolby Vision/HLG)**. Converting HDR to standard H.264 without tone mapping looks washed out | Detect HDR and warn; cheat sheet recommends turning off HDR video; tone mapping is a later step |
| Memory | iOS Safari kills tabs at roughly 1–2 GB. The current ffmpeg.wasm path loads the whole file into memory and fails on large phone clips | Streaming encode (read the file in slices, small output buffer) keeps memory flat |
| Screen lock / backgrounding | iOS pauses the page when the screen locks or the app switches; encoding stops | Keep the screen awake (Wake Lock), show "keep this screen open", restart cleanly if interrupted |
| Speed | Hardware encoding of a 10–30 s clip: seconds on recent phones; old devices slower | Real progress bar; estimate before starting |
| Unsupported browser | No WebCodecs or encoder refuses the config | Fall back to ffmpeg.wasm for small files only; otherwise ask to retry on a computer |

**Failure policy (requirement):** never upload an unoptimized original silently. On failure the
admin sees why, and chooses *Try again*, *Try on a computer*, or *Upload original anyway* (only
under 50 MB, explicitly confirmed, marked "Not optimized" in the library), or *Cancel*. Nothing is
uploaded until optimization succeeds or the admin chooses.
**Today's production uploader does the opposite:** on a compression error it uploads the original
silently (`lib/utils/compressMedia.ts`). Fixing that message is the first item of the media phase.
