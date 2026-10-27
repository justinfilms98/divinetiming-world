# Automatic Media Optimization — audit and proposal (2026-10-26)

Status: **planning only.** Nothing in this document has been implemented. No storage policies,
media records, uploads or production settings were changed while preparing it.

---

## 1. Audit

### 1.1 Storage limits, usage and capacity

| | Value |
|---|---|
| Supabase plan | **Free** (organization `divinetiming.world`) |
| File storage included | 1 GB |
| Used | **335 MB** in bucket `media` (219 MB video, 101 MB images, rest other) — about **665 MB left** |
| Max size per file | **50 MB** (Free plan hard cap; bucket `media` is also set to 50 MB) |
| Bandwidth included | 10 GB / month (5 GB cached + 5 GB uncached), shared by database, storage and functions |
| Database | 16 MB of 500 MB |
| Other buckets | `hero-videos` (50 MB cap), `event-thumbnails`, `gallery-covers`, `music-covers`, `public-media` — all empty, unused |

**Bandwidth is the real constraint, not storage.** Supabase edge logs for the last 24 hours:

| Source | Clients | Logged storage downloads | Of which video |
|---|---|---|---|
| Real visitors + Vercel image fetchers | 70 | 3.4 GB | 2.6 GB |
| This PC (automated hero testing today) | 1 | 12.1 GB | 10.7 GB |

Logged sizes are an upper bound (video requests use byte ranges that browsers often abandon early),
but even a fraction of 2.6 GB/day of video means the **monthly Free allowance is likely already
exceeded**. My hero-carousel test runs today added a large one-off amount; future video testing
will use local copies. Please check *Supabase → Organization → Usage* for the billing-accurate figure.

### 1.2 How uploads work today

- **Media Library and editors** (`UniversalUploader`): optional in-browser compression → signed
  upload URL from `/api/admin/media/upload-path` → direct browser-to-Supabase upload to
  `media/library/<timestamp>-<name>` → record created by `/api/admin/media/register`
  (`external_media_assets`). Max 100 MB selectable, but Supabase rejects anything over 50 MB.
- **Homepage hero editor** (`DashboardHeroEditor`): same uploader with the `hero` preset; poster
  images compressed to ≤1.5 MB / 1920 px and uploaded under `hero/<page>/slot-N/`.
- Filenames are timestamped, so a new upload never overwrites an older file.
- "Remove" in the Media Library deletes only the library record; the file stays in storage
  (D0 reworded the dialog to say so). There is no storage clean-up tool yet, so removed files keep
  counting toward the 1 GB.
- From D0, new uploads are registered as **Internal** (previously Public, which put new videos
  straight onto the public Videos tab).
- Signed-URL uploads do not set a cache lifetime, so files are stored with `no-cache` or
  `max-age=undefined` (older direct uploads have `max-age=3600`).

### 1.3 Existing compression

`lib/utils/compressMedia.ts` already exists:

- **Images:** `browser-image-compression`, only when larger than 5 MB (2 MB for hero); max 1920 px.
  Keeps aspect ratio. Smaller images are uploaded untouched.
- **Video:** `ffmpeg.wasm` (single-threaded, ~30 MB engine downloaded from unpkg on first use),
  H.264 + AAC, `+faststart`. Standard preset: only above 12 MB, ≤1920×1080, ~20 MB target.
  Hero preset: above 3 MB, ≤1280×720, ~8 MB target.
- **On failure it silently uploads the original.** The current hero clips (2560×1440, 10 s,
  ~16 Mbit/s, 20 MB each) are larger than either preset would produce, so they were either
  uploaded without compression or compression failed silently.
- ffmpeg.wasm is slow (minutes for a 1440p clip on a laptop) and frequently runs out of memory on
  phones, especially iPhone Safari.

### 1.4 Optimized versions

None are generated. One file per upload; no renditions, no posters extracted from video, no
width/height recorded (all 22 media records have empty dimensions), no "already optimized" marker.

### 1.5 Hero video delivery and caching

- Served straight from Supabase Storage public URLs (Cloudflare in front).
- Response headers: `Cache-Control: private, no-cache` → browsers must re-validate and Supabase's
  CDN reports `DYNAMIC`, so repeat visits re-download.
- Images go through Vercel's `next/image` optimizer (resized WebP/AVIF, cached by Vercel), which
  fetches each original from Supabase once per size.
- Hero carousel fix (preview `k6qhsbxu9`): one video downloads at a time, the next only loads
  metadata, and played clips are kept in memory so loops do not re-download. Measured over 80 s on
  a phone: ~64 MB vs ~161 MB on today's live site. A visitor who leaves after 10 s downloads ~20 MB.

### 1.6 Mobile vs desktop versions

Not supported. Phones download the same 2560×1440 file as desktops. Focal points are art-directed
in code (`lib/media/heroArtDirection.ts`) for mobile and desktop crops, but there is one source file.

### 1.7 Hosting, bandwidth and cost

| Service | Plan | Relevant limits | Notes |
|---|---|---|---|
| Supabase | Free ($0) | 1 GB storage, 50 MB/file, 10 GB/month bandwidth | Free projects over quota can be restricted after warnings |
| Supabase Pro | $25/month | 100 GB storage, 250 GB bandwidth, large files | Overage roughly $0.09/GB uncached |
| Vercel | team `divine-timings-projects` (plan not visible to me) | Hobby is for non-commercial use; image optimization and bandwidth limits apply | A store taking payments normally needs Pro ($20/user/month) |

Prices are list prices as I know them; please confirm on the vendors' pricing pages before deciding.

---

## 2. What the numbers mean

Per homepage visit today: ~20 MB (phone, leaves after 10 s) to ~60 MB (stays a full loop).
With properly encoded renditions:

| Rendition | Resolution | Bitrate | 10 s clip |
|---|---|---|---|
| Today | 2560×1440 | ~16 Mbit/s | 20 MB |
| Desktop web | 1920×1080 | ~4.5 Mbit/s | **~5.5 MB** |
| Phone | 1280×720 (or 720×1280 portrait cut) | ~2 Mbit/s | **~2.5 MB** |
| Poster | JPEG/WebP still | — | ~150 KB |

That is a **~85–90 % reduction** in hero bandwidth with no visible loss on phones and very little
on desktop. Even so, at current traffic (≈70 visitors/day) optimized heroes would still be roughly
5–15 GB/month — around or above the Free allowance. So the plan also needs a delivery decision
(section 4, decision 1).

---

## 3. Video processing options

| | Browser-based | Server-side | Managed video service |
|---|---|---|---|
| How | Encode on the uploader's device before upload. **WebCodecs** (hardware H.264 encoder built into Chrome, Edge, Safari 16.4+) via the open-source Mediabunny library; existing ffmpeg.wasm as fallback | A worker with native ffmpeg transcodes after upload | Upload to Mux / Cloudflare Stream / Bunny Stream; they transcode and stream adaptive HLS |
| Fits current stack | Yes — no new service | **No** on our current hosts: Vercel functions have a 4.5 MB request cap and no native ffmpeg; Supabase Edge Functions run Deno/wasm with tight CPU, memory and time limits. Needs an extra host (Fly.io/Render/GitHub Actions) holding a service key | New vendor account, API keys, webhooks |
| Speed | Seconds for a 10–15 s clip with hardware encoding; minutes with the wasm fallback | ~1–3 min queue + encode | ~1–2 min |
| Reliability | Depends on device; must keep the tab open; older phones may fall back | High | High |
| Mobile/desktop versions | Yes — we produce 1080p + 720p + poster | Yes | Automatic adaptive streaming |
| Recurring cost | **$0** | ~$5–10/month host (or free GitHub Actions minutes) | Cloudflare Stream ≥$5/month; Mux usage-based (small at our volume); Bunny Stream ~$1/month minimum |
| Bandwidth off Supabase | No (unless delivery moves) | No (unless delivery moves) | **Yes** |

**Recommendation: browser-based processing with WebCodecs, ffmpeg.wasm fallback.** For a site
with three hero clips and occasional library videos, it is the simplest option with no new
services or monthly cost, it reuses the existing uploader, and it keeps all credentials server-side
(the browser still only receives a one-time signed upload URL). It also means files above 50 MB
straight off a phone can be shrunk *before* hitting the Free-plan file cap.

A managed service only becomes worthwhile if they start posting long-form video on the site itself
(YouTube already covers that).

---

## 4. Proposed feature (mobile-first)

### Upload flow (same screen on phone and desktop)

1. **Choose file** → instant analysis: type, resolution, duration, frame rate, bitrate, file size,
   orientation. Clear warnings in plain language (e.g. "4K, 48 s — we'll make a 1080p web version").
2. **Optimizing…** with a real progress bar per step: *Analyzing → Creating desktop version →
   Creating phone version → Creating poster → Uploading → Ready*. Uploads resume if the phone
   briefly drops signal (Supabase resumable uploads).
3. **Result card:** original vs optimized size ("20.0 MB → 5.4 MB desktop · 2.4 MB phone"),
   side-by-side preview of the optimized clip with the existing focal-point controls overlaid,
   and the desktop and phone crops previewed.
4. **Save as draft / Use on homepage.** Nothing goes public until an admin publishes, as today.

### Images

- Long edge capped at 2560 px (hero 2880 px), aspect ratio preserved, EXIF orientation applied,
  location metadata stripped, sRGB, WebP or high-quality JPEG (~q82).
- Width, height and optimized size recorded on the media record (fixes intrinsic gallery frames
  and layout shift).
- `next/image` continues to produce per-device sizes on delivery.

### Videos

- Desktop rendition: H.264 MP4, ≤1920×1080, ~4.5 Mbit/s, `faststart`, no audio for hero clips.
- Phone rendition: ≤1280×720, ~2 Mbit/s.
- Poster: frame at ~0.5 s (admin can pick another frame), shown instantly while video loads.
- The hero player picks the phone or desktop rendition from screen size, and shows the poster only
  when the visitor has Data Saver on or a very slow connection.

### Safety rules

- **Originals are never overwritten or deleted.** Renditions are new files next to the original
  (`library/<id>/web-1080.mp4`, `…/mobile-720.mp4`, `…/poster.webp`). Removing an original is a
  separate, explicit admin action with a confirmation dialog.
- **No repeated compression:** a content fingerprint (SHA-256) and an "optimized by Divine Timing"
  marker are stored; a file that already meets the target (resolution and bitrate at or below
  target) is kept as-is, and re-uploads of an identical file are detected.
- **Failures are visible, never silent:** if optimization fails the admin sees why, with choices
  *Retry*, *Upload original as-is* (if under 50 MB) or *Cancel*. The media record shows
  "Needs optimization" until resolved.
- New uploads get a one-year cache lifetime (safe because every filename is unique).
- Focal points, publishing status and usage labels are unchanged; they attach to the media record,
  not to a specific rendition.
- Existing hero clips: optimized copies are generated as **new** files and switched over only with
  your approval; the current files stay in place for rollback.

### Data model (migration, needs review)

- `external_media_assets`: add `width`, `height`, `duration_s`, `original_bytes`,
  `content_sha256`, `processing_status` (`ready` / `processing` / `failed` / `needs_optimization`).
- New `media_renditions` table: `asset_id`, `kind` (`web_1080`, `mobile_720`, `poster`,
  `image_web`), `storage_path`, `url`, `width`, `height`, `bytes`, `bitrate`, `created_at`.
  RLS: public read, admin write — matching the existing lockdown (054–057).

---

## 5. Estimate

| Phase | Scope | Estimate |
|---|---|---|
| M0 | Quick wins: one-year cache on new uploads, poster-only on Data Saver/slow networks, honest failure messages in the current compressor | 0.5–1 day |
| M1 | Image pipeline: analysis, compression, dimensions, before/after sizes, duplicate detection | 1.5–2 days |
| M2 | Video pipeline: WebCodecs encoder (+ wasm fallback), 1080p + 720p + poster, progress, preview, failure handling | 3–4 days |
| M3 | Rendition schema + hero player choosing phone/desktop sources | 1–1.5 days |
| M4 | Optimized copies of the three current hero clips (new files, switched with approval) | 0.5 day |
| QA | Real iPhone Safari / Android Chrome uploads and playback | 1 day |
| **Total** | | **≈ 8–10 working days** |

M0 + M4 alone (≈1.5 days) remove most of today's bandwidth.

---

## 6. Decisions needed

1. **Bandwidth/plan:** stay on Supabase Free and rely on optimization, upgrade to Supabase Pro
   ($25/month), or move video delivery to a low-cost CDN (for example Cloudflare R2, which has no
   download fees). Recommendation: confirm actual usage first; if over quota, Pro is the simplest
   fix and also removes the 50 MB file cap and the 1 GB storage cap.
2. **Originals:** keep full-resolution originals in Supabase (needs Pro for files over 50 MB and
   for space), or keep originals in Google Drive/on the editors' computers and store only
   optimized versions on the site.
3. **Existing hero clips:** approve generating optimized copies (new files) and switching the hero
   slots to them, keeping the current files for rollback.
4. **Cache headers on new uploads:** approve the one-year cache setting for future uploads.
5. **Vercel plan:** confirm whether the team is on Hobby or Pro (commercial use and image
   optimization limits).
