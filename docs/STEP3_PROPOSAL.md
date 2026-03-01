# Step 3 Proposal: WYSIWYG for About (and content pages)

**Status:** Implemented. DB verification: `bio_html` column confirmed (`information_schema.columns` for `about_content`).

---

## Goal

Allow editing the About page (and optionally other content blocks) via a rich-text editor in Admin, without a “WordPress clutter” feel. Content should stay minimal, and the editor should plug into the existing hero + Uploadcare pipeline.

---

## Recommended editor: **Tiptap** (headless, React)

- **Why Tiptap:** Lightweight, headless, React-friendly. You ship only the extensions you need (paragraphs, bold/italic, links, lists, maybe one level of heading). No toolbar bloat, no iframes, no TinyMCE/CKEditor weight. Output is JSON or HTML; we store one format and render on the public site.
- **Alternatives considered:** Lexical (more complex, heavier). Slate (lower-level). Plate (Tiptap-based, more presets). For “minimal and clean,” Tiptap with a small extension set wins.

**Concrete stack:** `@tiptap/react` + `@tiptap/starter-kit` (or hand-pick: Document, Paragraph, Text, Bold, Italic, Link). Optional: one “Insert image” button that opens the existing **UniversalUploader** (or MediaLibraryPicker); insert returns an image node with `src` = Uploadcare CDN URL. No drag-and-drop blocks, no 50 toolbar buttons.

---

## Integration with existing system

- **Hero / uploads:** No change. Hero Editor and Uploadcare stay as-is. The WYSIWYG “Insert image” action uses the same `lib/uploadcare` + `UniversalUploader` flow; we only insert the chosen URL into the editor as an image node. No second upload pipeline.
- **Admin UX:** One new area: e.g. **Admin → About** (or **Content**) with a single “Bio / about text” section: Tiptap editor, Save button. Optional: separate tab or section for “Other content” if we later add more editable blocks (e.g. booking intro). No sidebar full of widgets.

---

## Data model

- **Current:** `about_content.bio_text` (TEXT, single row). Today it’s plain or minimal markdown.
- **Change:** Add a column for rich content, or repurpose `bio_text`:
  - **Option A:** Keep `bio_text` as plain text; add `about_content.bio_html` (TEXT) for WYSIWYG output. Public About page renders `bio_html` if present, else `bio_text` (with optional simple line-break formatting). Migration: `ALTER TABLE about_content ADD COLUMN bio_html TEXT;`
  - **Option B:** Store JSON (Tiptap JSON doc) in `bio_content` (JSONB) and render on the server with a small Tiptap-to-React renderer (no editor on public site). Gives maximum control but requires a render path.
- **Recommendation:** Option A. Store HTML from Tiptap; sanitize on save (e.g. `DOMPurify` or a allowlist). Public page uses `dangerouslySetInnerHTML` with sanitized HTML, or a tiny component that only allows tags we support (p, strong, em, a, ul, ol, li, br, img with src from ucarecdn). Minimal and auditable.

---

## Keeping it minimal (no WordPress clutter)

- **Toolbar:** One row: Bold, Italic, Link, Bullet list, Numbered list. Optional: “Image” that opens existing media picker. No fonts, no colors, no 10 heading levels.
- **No blocks:** No “Add block” / drag-and-drop sections. About stays one editable area (bio). If we add more pages later, each gets one WYSIWYG field, same pattern.
- **Preview:** Optional “Preview” button that opens current content in a modal or new tab with the same styling as the public About section. No live split-screen builder.
- **Scheduling / versioning:** Defer. Step 3 is “edit and save”; we can add “draft vs published” or history in a later step if needed.

---

## Summary

| Item | Proposal |
|------|----------|
| Editor | Tiptap (React), minimal extensions |
| Images | Reuse UniversalUploader / MediaLibraryPicker; insert URL into editor |
| Data | `about_content.bio_html` (TEXT); sanitize on save; render on public About |
| Admin | Single “About” or “Content” section; one toolbar row; Save |
| Scope | About page only for Step 3; no scheduling/versioning yet |

Once this is approved, implementation can follow: migration, sanitize helper, Tiptap editor component, Admin About page, public About render path.

---

## Verification (post-implementation)

- **DB:** Confirm `bio_html` exists: `select column_name, data_type, is_nullable from information_schema.columns where table_name = 'about_content' order by ordinal_position;`
- **Security sanity check:** In Admin → About, paste HTML containing `<script>alert(1)</script>`, `<p>hi</p>`, `<img src="https://example.com/x.png">` and save. Expected: only `<p>hi</p>` remains (script and non-CDN img stripped). Or run `node scripts/assert-bio-sanitize.mjs` to assert sanitizer behavior.

---

## Architecture clarifications (approved before implementation)

### 1. Sanitization

- **Library:** Use **`sanitize-html`** (npm package). It runs in Node, has a clear allowlist API, and is well-suited for server-side sanitization. DOMPurify is browser-first (jsdom on server is heavier); sanitize-html is designed for this use case.
- **Where:** Sanitization runs **in the API route** (or a small server helper called by the route) **before** writing to the DB. Flow: Admin submits `bio_html` → API receives it → sanitize with allowlist (p, strong, em, a, ul, ol, li, br, img with allowed src) → write result to `about_content.bio_html`. Never persist unsanitized HTML.

### 2. Rendering strategy

- **Mechanism:** Yes — render with **`dangerouslySetInnerHTML`** on the public About page, but **only** with HTML that has already been sanitized on save. The stored value is the single source of truth; we don't sanitize again at render time (no double escaping). If we ever need to re-sanitize on read (e.g. if legacy data exists), we can do that in `getAboutContent()` before returning.
- **Preventing layout-breaking markup:**
  - **Allowlist:** Only allow tags we support (p, strong, em, a, ul, ol, li, br, img). No div, section, script, style, or arbitrary attributes beyond `href` on links and `src`/`alt` on images. That prevents injected wrappers or scripts from breaking layout.
  - **Image URLs:** Restrict `img` `src` to same origin or our CDN (e.g. `ucarecdn.com` / `ucarecdn.net`) so we don't load arbitrary external resources.
  - **CSS:** Render the bio inside a **constrained container** (e.g. a wrapper with `max-w-prose` and a class like `about-bio-content`) and style that wrapper so paragraphs, lists, and images have sensible max-width and spacing. No inline styles from the editor; all layout comes from our CSS.

### 3. Image handling in Tiptap

- **Max-width clamp:** Yes — use the same idea as HeroLogo. In the **public About** render path, target images inside the bio container with CSS: e.g. `.about-bio-content img { max-width: 100%; height: auto; max-height: 400px; }` (or a clamp like `min(90vw, 800px)`). So inline images never dominate the layout and stay within the content column.
- **Responsive:** Yes — `max-width: 100%` and `height: auto` make them responsive by default. No fixed widths; images scale with the container. Optional: add `width` and `height` attributes when inserting (from Uploadcare metadata) for aspect-ratio and CLS, but the visible size is still controlled by the CSS clamp above.
