# Real-device checklist — iPhone Safari and Android Chrome

Status (2026-11-10): **not yet run on physical devices.** All mobile results so far come from desktop
Edge emulating 320–430 px screens. Emulation can't show notches, home indicators, real touch, iOS
autoplay rules, Low Power Mode, camera-roll uploads or mobile-network speed.

## Before you start

- Devices:
  - Any recent iPhone (Safari, latest iOS); a small iPhone (SE or mini) if available.
  - An Android phone (Chrome), ideally Pixel or Samsung.
- Write down the device, OS version and browser version.
- Public checks: use **divinetiming.world**.
- Admin upload checks: use **staging only**. Don't upload test files to production.
- Run each section in portrait, then in landscape where marked (↻).
- Repeat the hero and footer checks once on mobile data, with Low Data Mode (iPhone) or Data Saver (Android) on.
- Mark each line pass/fail and screenshot any failure (iPhone: side + volume up; Android: power + volume down).

## 1. Navigation

- [ ] The black bar sits below the notch / Dynamic Island / camera hole; the logo and menu button aren't covered. ↻
- [ ] The menu button opens the menu at the first tap; links are easy to hit and go to the right pages.
- [ ] While the menu is open the page behind doesn't scroll; closing it returns you where you were.
- [ ] The phone's Back gesture or button behaves sensibly with the menu open (closes it, or goes back one page).
- [ ] The current page is highlighted gold; text stays white and readable.
- [ ] The bar stays usable while scrolling and never hides content under it.

## 2. Safe areas (screen edges)

- [ ] Nothing important sits under the iPhone home indicator or the Android gesture bar: footer bottom line, admin Save bar, upload buttons.
- [ ] Landscape: nothing is cut off by the notch side. ↻
- [ ] Admin: the sticky Save bar and the Media Library bottom sheet sit fully above the home indicator.

## 3. Hero media

- [ ] The photo appears quickly on mobile data; no long blank or black screen.
- [ ] The white DIVINE:TIMING logo is sharp, not blurry, on a high-resolution screen.
- [ ] "We are one." and both buttons are readable over the photo.
- [ ] If a video slot is turned on (staging): it plays muted inside the page, not fullscreen.
- [ ] With iPhone Low Power Mode on, the poster/photo shows instead of a blank frame.
- [ ] Rotating the phone doesn't jump or crop the hero badly. ↻

## 4. Buttons and links

- [ ] **Listen** opens the Music page.
- [ ] **Join the tribe** scrolls to the Tribe section, and its heading isn't hidden under the nav bar.
- [ ] Buttons respond to a single tap: no double-tap zoom, no delay.
- [ ] Spotify, YouTube, both Instagram accounts, SoundCloud and Beatport open the right profile (app or browser), and you can get back to the site.
- [ ] Both Instagram links open different accounts: @divinetimingworld and @divinetiming_ofc.

## 5. Footer

- [ ] Social links show as two rows of three: (Spotify, YouTube, @divinetimingworld) then (@divinetiming_ofc, SoundCloud, Beatport).
- [ ] Very small phones (320 px wide, iPhone SE 1st generation): it's fine for the rows to wrap further, as long as nothing is cut off and the order holds.
- [ ] With larger text on (iPhone: Settings → Display → Text Size; Android: Font size at 130%), handles and links don't overflow or overlap.
- [ ] "Reach out" is one line and opens Contact.

## 6. Events page

- [ ] The "The story so far" heading and "Every gathering, from the first 50 to 600+" are readable.
- [ ] "8 shows · 2 cities" appears below.
- [ ] Event rows and images load; long venue names don't push the layout sideways.

## 7. Admin on a phone (staging only)

- [ ] Signing in works; you stay signed in after closing and reopening the browser.
- [ ] Media Library upload, photo from the camera roll:
  - It uploads, with progress shown.
  - iPhone: check whether HEIC photos arrive as JPEG; note it if they're rejected.
- [ ] Media Library upload, short video from the phone: it uploads or clearly explains a size limit. Lock the screen mid-upload and check the message afterwards.
- [ ] Homepage & Hero: "Choose from library" opens a bottom sheet; choosing a logo and tapping Save works; nothing else changes.
- [ ] The on-screen keyboard doesn't cover the field you're typing in.
- [ ] Leaving with unsaved changes shows the warning.

## 8. Overall

- [ ] No page scrolls sideways.
- [ ] Pages feel quick on mobile data; no page takes more than a few seconds.
- [ ] The Media page doesn't start downloading videos until you tap one.

## Report back

For each failure, send the device, OS and browser version, the page, what you expected, what happened, and a screenshot.
