# @ffmpeg/ffmpeg compatibility patch (added 2026-11-10)

`patches/@ffmpeg+ffmpeg+0.12.15.patch` changes one statement in `@ffmpeg/ffmpeg` so the site builds on Next.js 16.4.x. It shipped in the Next.js 16.4.6 security release (`main` c319a7c).

## Why it's needed

The admin uploader compresses large videos in the browser with ffmpeg.wasm (`lib/utils/compressMedia.ts`). `FFmpeg.load()` in `dist/esm/classes.js` creates its worker like this:

```js
this.#worker = classWorkerURL
  ? new Worker(new URL(classWorkerURL, import.meta.url), { type: "module" })
  : new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
```

From Next.js 16.4.3, Turbopack tries to resolve every `new URL(..., import.meta.url)` at build time. It can't resolve the first branch because `classWorkerURL` is a runtime value, so `next build` fails with `Module not found: Can't resolve (<dynamic> | 'undefined')`. This is a known regression: it was fixed in 16.3.0 and came back in 16.4.3 ([ffmpegwasm/ffmpeg.wasm#793](https://github.com/ffmpegwasm/ffmpeg.wasm/issues/793)).

The patch keeps only the static branch, `new Worker(new URL("./worker.js", import.meta.url), { type: "module" })`. Our code never passes `classWorkerURL`, so behaviour is unchanged. Turbopack bundles the worker as `/_next/static/immutable/chunks/turbopack-worker-*.js`.

## Version

- Applies to `@ffmpeg/ffmpeg` **0.12.15** only.
- `package.json` pins it exactly (`"@ffmpeg/ffmpeg": "0.12.15"`, no caret), so an install can't pick up a different version that the patch doesn't match.
- 0.12.15 is the latest release as of 2026-11-10. The ffmpeg core (`@ffmpeg/core@0.12.6`) is fetched at runtime from unpkg and isn't affected.

## How it's applied

- `patch-package` (dev dependency) runs from the `postinstall` script on every `npm install` / `npm ci`, locally and on Vercel.
- If the patch can't be applied, `patch-package` exits with an error. The install then fails loudly instead of shipping an unpatched build.
- `.gitattributes` keeps `patches/*.patch` at LF line endings, so Windows checkouts don't corrupt it.
- Installs that skip dev dependencies or scripts (`--omit=dev`, `--ignore-scripts`) won't apply the patch. Vercel's normal build does both installs, so it's fine.

## How it's tested

- **Automated:** `lib/utils/ffmpegPatch.test.ts` checks three things:
  - The patch file name matches the installed version and the exact pin in `package.json`, and `postinstall` runs `patch-package`.
  - The installed `classes.js` contains only the static worker construction.
  - `compressMedia.ts` never passes `classWorkerURL`.

  On 2026-11-10 I confirmed the test fails when the patch is reversed.
- **Build:** `next build` on Next.js 16.4.x fails without the patch, so CI and Vercel builds act as a second check.
- **Manual, after any ffmpeg or Next.js change:**
  1. Upload a video over 12 MB in Media Library, or over 3 MB in a hero slot, on staging.
  2. Confirm the "Compressing video for web…" step finishes and the file uploads smaller.
  3. Confirm the uploaded file is valid H.264/AAC (`ffprobe`).

  On 2026-11-10, staging compressed 18.8 MB to 3.74 MB (1920×1080, same 10 s duration). In production, a guarded browser-only check compressed the same file with the upload blocked, so nothing was stored.

## When to remove it

Remove the patch when **either** of these happens:

1. Next.js/Turbopack stops failing on dynamic `new URL(x, import.meta.url)`. Check the Next.js release notes and the issue above.
2. `@ffmpeg/ffmpeg` publishes a version that builds without the dynamic branch. For example, it could construct the custom-worker case with a plain `new Worker(classWorkerURL)` that bundlers don't analyse.

To remove it:

1. Delete the patch file.
2. Remove `postinstall` and `patch-package` from `package.json`, restore a caret range for `@ffmpeg/ffmpeg` if wanted, and remove `lib/utils/ffmpegPatch.test.ts`.
3. Run `npm install`, then `next build`, then the manual staging compression check above.

To upgrade ffmpeg while keeping the patch:

1. Install the new version.
2. Re-create the patch: edit the file in `node_modules`, then run `npx patch-package @ffmpeg/ffmpeg`.
3. Update the pin, then run the tests and the staging check.
