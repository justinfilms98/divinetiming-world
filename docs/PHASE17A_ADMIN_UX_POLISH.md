# Phase 17.A — Admin UX Polish (Media / Picker / Events Thumbnail)

## Summary

Phase 17.A adds small structural improvements to the admin media experience without changing core behavior or architecture. It builds on Phase 17 (Media Admin Cleanup + Legacy Handling) to make the admin feel like a professional CMS.

**What**

- **Admin Media Library:** Real thumbnail previews with robust fallback (no broken icons), plus client-only search and sort.
- **Media Picker:** Selected-item preview before confirming, and persistence of the “Include legacy items” toggle in localStorage.

**Why**

- Thumbnails improve scanability and trust; search/sort reduce friction in large libraries.
- Picker preview and legacy persistence reduce mistakes and repeated toggling.

**Constraints respected**

- No CornerNav or design-system changes; no new libraries; server resolvers unchanged; legacy default remains hidden.

---

## Files changed

| File | Change |
|------|--------|
| `components/admin/MediaThumb.tsx` | New: shared thumbnail component with image/video display, loading/error fallback (no broken icons), aspect-square, object-cover. |
| `app/admin/media/page.tsx` | MediaThumb in grid; search input (“Search media…”); sort dropdown (Newest / Oldest / Name A–Z); client-side filter/sort applied to current and legacy pools; removed duplicate img/fallback markup. |
| `components/admin/MediaLibraryPicker.tsx` | `includeLegacy` initialized from and persisted to `localStorage` key `dt_admin_media_include_legacy`; selected-asset state and preview bar with “Use this” / “Choose another”; grid tiles use MediaThumb for consistent fallbacks. |
| `docs/PHASE17A_ADMIN_UX_POLISH.md` | This document. |

---

## Manual verification steps

1. **Upload → preview in admin grid**  
   Upload an image at `/admin/media`. Confirm the card shows the actual image preview (or a neutral placeholder if the URL fails). No broken image icon.

2. **Search by filename**  
   On `/admin/media`, type part of a filename in “Search media…”. List filters immediately; clearing the search restores the list.

3. **Sort order**  
   Change sort to Newest, Oldest, and Name (A–Z). Confirm ordering updates instantly in both current and (when shown) legacy sections.

4. **Picker: selected preview**  
   Open the media picker (e.g. from Events or Collections). Click an asset. Confirm a preview bar appears with thumbnail, “Choose another”, and “Use this”. Click “Use this” and confirm the selection is applied and picker closes.

5. **Legacy toggle persistence**  
   In the picker (if the instance shows “Include legacy items”), check the box, close the picker, reopen it. Confirm the checkbox remains checked. Reload the page and reopen the picker; state should still be persisted. In a fresh browser (or after clearing localStorage), default should be OFF.

---

## Acceptance checklist

- [ ] Images in admin media grid show real previews where possible.
- [ ] Videos show poster when available; otherwise a clean “Video” placeholder (no broken icon).
- [ ] All cards use consistent aspect ratio and object-cover; no broken image icons.
- [ ] Search filters by filename/title (case-insensitive substring); works within current and legacy pools.
- [ ] Sort (Newest / Oldest / Name A–Z) works; legacy section remains hidden by default.
- [ ] Picker shows a selected-item preview with “Use this” and “Choose another”.
- [ ] “Include legacy items” state persists in localStorage (`dt_admin_media_include_legacy`); default is OFF when no stored value.
- [ ] Empty picker state still shows “Upload media” CTA to `/admin/media`.
- [ ] Build passes; no changes to CornerNav, resolvers, or unrelated pages.
