# Follow-up work found during D2-B.1 and Journal research (2026-11-11)

Not part of D2-B.1. Each item needs its own approval before it's changed.

## 1. YouTube Videos admin: new videos publish immediately

**What happens.**
- `POST /api/admin/videos` (`app/api/admin/videos/route.ts`) treats any status other than `draft` or `archived` as `published`.
- The admin "Add video" form (`app/admin/videos/page.tsx`) sends no status, so **every new video goes live on `/media` and the homepage Films section at once**.
- The same fallback applies when a video is edited: an update that leaves out `status` would publish a draft or archived video. Today's edit form always sends the status, so this is latent.
- Every other content route (events, collections, products, releases, journey) starts new items as drafts through `statusForCreate()` in `lib/admin/publicationStatus.ts`. Migration 058 made drafts the database default, but the route overrides it.

**Homepage refresh.** The route refreshes only `/media`. The homepage and `/media` are both rendered fresh on every request (`dynamic = 'force-dynamic'`), so visitors already see changes. Adding `revalidatePath('/')` keeps it consistent with the other routes and safe if the homepage is ever cached.

**Recommended fix** (one small commit, no migration):
1. Create: use `statusForCreate(statusInput)`, so new videos start as **draft**.
2. Update: change the status only when the request includes one, using `requestedStatus(statusInput, …)`; otherwise leave it as it is.
3. Refresh `/` as well as `/media` after create, update, delete and reorder.
4. Admin: add a status choice to the Add form, defaulting to Draft with a clear "Publish" option, and confirm with a toast saying whether the video is live.
5. Tests:
   - Create without a status is a draft.
   - An update without a status keeps the existing status.
   - Publish and archive still work.
   - Both paths are refreshed.
   - Signed-out requests change nothing.

The owners should know that after the fix, adding a video takes one extra step (Publish), matching events and collections.

## 2. Press Kit booking email

- Settings `booking_email` is now `info@divinetiming.world` (owner update, 2026-11-11). It drives Booking, Contact, the homepage booking section and booking-enquiry notification emails.
- The Press Kit has its own contact, Helle Marie, `info@divinetimingmusic.com`, +33 635 640 200. It falls back to the Settings email only when its own field is empty (`lib/presskit/display.ts`).
- **Recommendation**, an owner decision:
  - If Helle Marie should be reached at the new address, clear the Press Kit contact email so it follows Settings automatically.
  - If she's a separate contact, keep it and confirm the old address still works.
- Not changed without approval.

## 3. Unpublished media visibility (security)

Covered in full in `SECURITY_UNPUBLISHED_MEDIA_AUDIT_2026-11-11.md` (branch `security/unpublished-media`).
Recommended ahead of the Journal.
