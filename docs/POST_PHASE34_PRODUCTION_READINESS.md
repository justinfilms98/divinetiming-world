# Post-Phase-34 Production Readiness

Phases 1–34 are design-complete and production-polished. Phase 35 (hero stutter) remains a **technical backlog** and does not block launch. Use this checklist before and during production rollout.

---

## 1. Production Environment Audit

**Verify in Vercel / environment variables:**

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `STRIPE_SECRET_KEY` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes |
| `ADMIN_EMAILS` | Yes |
| `GOOGLE_DRIVE_CLIENT_ID` | Optional |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Optional |

- [ ] All required variables set in production
- [ ] **No Uploadcare keys** anywhere
- [ ] No unused env variables left in use

---

## 2. Supabase Production Safety

**Row Level Security (RLS)** — confirm enabled where needed:

- [ ] `external_media_assets`
- [ ] `galleries`
- [ ] `hero_slots`
- [ ] `products`
- [ ] `orders`
- [ ] `booking_requests`

**Client usage:**

- Public site → **anon** client only
- Admin routes → **service role** (server-only)
- Service role **never** exposed to the browser

---

## 3. Storage Verification

**Supabase bucket:** `media`

- [ ] Uploads work (admin media / hero)
- [ ] File paths stored correctly in DB
- [ ] Public URLs resolve
- [ ] Large videos stream as expected

---

## 4. Stripe Checkout Test

**Run a real test purchase:**

1. Add product to cart  
2. Checkout → Stripe redirect  
3. Return page  
4. Webhook processing  

- [ ] Order stored in DB  
- [ ] Download / access works  
- [ ] Webhook logs clean  

---

## 5. Admin Functionality Test

- [ ] Hero slots (upload, reorder, enable/disable)
- [ ] Events CRUD
- [ ] Media upload
- [ ] Gallery creation
- [ ] Shop product creation
- [ ] Booking submissions visible in admin

- [ ] Admin routes require login  
- [ ] Non-admins are blocked  

---

## 6. SEO Verification

**Static assets:**

- [ ] `/robots.txt`
- [ ] `/opengraph.png` (or equivalent OG image)
- [ ] `/favicon.ico`

**Preview testing:**

- Home, Shop product, Media gallery  
- [ ] Twitter Card Validator  
- [ ] Facebook Sharing Debugger  

---

## 7. Performance Check

**Lighthouse** on: Home, Media, Shop, Product page  

Targets:

- Performance: **90+**
- Accessibility: **95+**
- Best Practices: **95+**

*(Hero stutter may affect Performance slightly until Phase 35; acceptable for launch.)*

---

## 8. Build & Deployment

```bash
npm run build
npm run start
```

- [ ] No build warnings  
- [ ] No hydration errors  
- [ ] No console errors in browser  

---

## 9. Production Monitoring (Recommended)

Consider adding:

- **Sentry** (errors), or  
- **Logtail / Axiom** (logs)  

Useful once traffic grows.

---

## 10. Launch Checklist

**Pages load cleanly:** Home, Events, Media, Shop, Booking, EPK, Press Kit  

**Test on:** Desktop, Mobile, Safari, Chrome  

- [ ] All critical paths verified  
- [ ] Ready to announce  

---

## Phase 35 (Hero Stutter) — Backlog

The hero stutter is treated as a **future performance optimization**, not a launch blocker. Likely causes:

1. Video decode throttling  
2. Next.js video hydration timing  
3. Browser GPU compositing  
4. Hidden video autoplay limitations  

---

## Current Project Status

| Phase | Status |
|-------|--------|
| 1–17 | Architecture + media system |
| 18–25 | Performance + typography |
| 26–31 | Brand + atmosphere + color discipline |
| 32–34 | Silence + signature + final harmony |
| 35 | Hero stutter (backlog) |

**Result:** Production-grade website; launch when the checklist above is satisfied.
