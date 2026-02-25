# 5iveArts — Planned Upgrades

This document lists every planned upgrade for the site, grouped by priority tier.
Items marked ✅ are **done**. The rest are pending — tell Copilot which item(s) you
want to work on next and it will implement them.

---

## How to read this document

Each item has:
- A short title and description of *what* it adds
- *Why* it matters (business or technical reason)
- The main packages or APIs involved
- An effort estimate (🟢 small / 🟡 medium / 🔴 large)

---

## 🔴 Tier 1 — Critical (must-have before launch)

These gaps mean the site **cannot operate as a real shop** right now.

---

### 1. ✅ Database + order persistence (Supabase)

**Status:** Infrastructure complete — follow `supabase/README.md` to connect your project.

**What was done:**
- `supabase/migrations/001_schema.sql` — creates `products`, `orders`, `order_items` tables with indexes, RLS policies, and a `decrement_stock()` function
- `supabase/seed.sql` — seeds all 6 products; safe to re-run
- `src/lib/supabase.ts` — server-side service-role client (`getSupabaseAdmin()`)
- `src/types/supabase.ts` — TypeScript types mirroring the schema
- `src/app/api/webhooks/stripe/route.ts` — `handleCheckoutCompleted` now:
  - Guards against duplicate processing (idempotency check)
  - Inserts an `Order` row with full Stripe session data
  - Inserts `OrderItem` rows per product
  - Decrements stock via `decrement_stock()` RPC
- `.env.example` updated with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `@supabase/supabase-js` added to `package.json` (run `npm install`)

**Still to do (optional follow-up):**
- Move product reads to Supabase instead of the static array (stock will then come from DB in real-time on product pages)

**Effort:** 🔴 Large — ✅ Done

---

### 2. Transactional email — order confirmation

**What:** Send a confirmation email to the customer after a successful payment.

**Why:** The webhook's `handleCheckoutCompleted` function has a `TODO` comment for this.
Customers expect an email receipt immediately after paying.

**Approach:**
- Add **Resend** (or Nodemailer + SMTP) for email delivery
- Create a React Email template: order summary, figure names, total, shipping ETA
- Call `resend.emails.send(...)` inside `handleCheckoutCompleted`

**Packages:** `resend`, `@react-email/components`

**Effort:** 🟡 Medium

---

### 3. Cart clear after successful payment

**What:** When Stripe redirects back to `/checkout/success`, automatically clear the cart.

**Why:** Currently the success page renders a thank-you message but the Zustand cart
still holds the purchased items. If the customer refreshes or comes back, the cart
appears full again.

**Approach:**
- Verify the Stripe session server-side on the success page (`stripe.checkout.sessions.retrieve`)
- On confirmed payment, call `useCartStore.getState().clearCart()` from a client component
- Guard against double-clears with session-ID deduplication

**Packages:** (none new — uses existing `stripe` SDK)

**Effort:** 🟢 Small

---

### 4. Real product images

**What:** Add actual product photography/renders and wire up Next.js `<Image>` correctly.

**Why:** Every `Product` in the catalogue references `/images/products/hp-spider-man.jpg` etc.,
but these files do not exist in `public/`. The site renders broken images everywhere.

**Approach:**
- Add placeholder images to `public/images/products/` (or host on Cloudinary/S3)
- Update `next.config.ts` `images.remotePatterns` if using an external CDN
- Add a `blurDataURL` placeholder for smooth loading

**Packages:** `sharp` (for local blur placeholders), or Cloudinary free tier

**Effort:** 🟢 Small (images) / 🟡 Medium (CDN setup)

---

### 5. Packlink label creation on order fulfilment

**What:** After payment is confirmed, automatically create a Packlink shipment and
store the label URL + tracking number.

**Why:** `src/lib/packlink.ts` has `createShipment()` already written but it is never called.
The seller currently gets no shipping label.

**Approach:**
- Call `createShipment()` inside `handleCheckoutCompleted` using the `packlink_service_id`
  from Stripe session metadata
- Store `label_url` and `tracking_number` in the new `Order` database row (see Upgrade 1)
- Optionally email the label PDF to the seller

**Packages:** (none new — uses existing `axios` + `packlink.ts`)

**Effort:** 🟡 Medium (depends on Upgrade 1 for order storage)

---

## 🟡 Tier 2 — Important (high value, do soon after launch)

These upgrades significantly improve conversion, trust, and operations.

---

### 6. User authentication + accounts

**What:** Let customers create accounts, log in, and see their order history.

**Why:** Without accounts:
- Customers cannot look up past orders
- You cannot save delivery addresses for repeat buyers
- Wishlists are impossible
- Admin access is impossible

**Approach:**
- Add **Clerk** (or NextAuth.js v5) for authentication
- Protected routes: `/account/orders`, `/account/settings`
- Link `Order` records to a `userId` in the database

**Packages:** `@clerk/nextjs` or `next-auth`

**Effort:** 🟡 Medium

---

### 7. Order history page

**What:** A `/account/orders` page listing the customer's past orders with status,
items, total, and tracking link.

**Why:** Customers need a self-service way to check their order without emailing you.

**Approach:**
- Requires Upgrade 1 (database) and Upgrade 6 (auth)
- Fetch orders by `userId` from Prisma
- Show order status: `pending` → `shipped` → `delivered`

**Effort:** 🟢 Small (once Upgrades 1 + 6 are done)

---

### 8. Admin panel (product + order management)

**What:** A password-protected `/admin` section for managing products, viewing orders,
updating stock levels, and marking orders as shipped.

**Why:** Right now any product change requires editing source code and redeploying.
A non-technical owner cannot manage the shop without a developer.

**Approach:**
- Use Next.js route groups: `(admin)/` with middleware auth guard (Clerk admin role or env-var secret)
- Pages: `/admin/products` (list, create, edit, delete), `/admin/orders` (list, update status)
- Or use a headless CMS like **Sanity Studio** for content (products, marketing copy)

**Packages:** `@clerk/nextjs` (admin role) or Sanity (`sanity`, `@sanity/client`)

**Effort:** 🔴 Large

---

### 9. Redis-backed rate limiter

**What:** Replace the in-memory `Map` in `src/lib/rateLimit.ts` with a Redis store.

**Why:** The current implementation works only on a single server process.
When deployed to Vercel (multiple serverless instances), each instance has its own Map —
a determined attacker can bypass the limit by hitting different instances.

**Approach:**
- Replace the `Map` with `@upstash/ratelimit` (works with Vercel Edge and serverless)
- Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.example`
- No changes needed in the API route files themselves (same `checkRateLimit` interface)

**Packages:** `@upstash/ratelimit`, `@upstash/redis`

**Effort:** 🟢 Small

---

### 10. Automated test suite

**What:** Unit tests for validation helpers and cart store; integration tests for API routes.

**Why:** There are currently zero tests. As the codebase grows, regressions in the payment
flow or validation logic are high-risk and hard to catch manually.

**Approach:**
- **Jest** + **@testing-library/react** for component and hook tests
- Test `src/lib/validate.ts` (all edge cases for email, country, cart items)
- Test `src/lib/rateLimit.ts` (window resets, limit enforcement)
- Test `src/store/cart.ts` (add, remove, quantity, subtotal)
- Mock API route tests with `next-test-api-route-handler` or `msw`

**Packages:** `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`

**Effort:** 🟡 Medium

---

### 11. SEO enhancements

**What:** Add `sitemap.xml`, `robots.txt`, per-product OpenGraph images, and JSON-LD
structured data for Google Shopping.

**Why:** Right now the site has basic `<title>` and `<description>` metadata but nothing
that helps search engines understand or rank individual product pages.

**Approach:**
- `src/app/sitemap.ts` — Next.js dynamic sitemap (auto-generated from product IDs)
- `src/app/robots.ts` — robots.txt
- Per-product `opengraph-image.tsx` using Next.js `ImageResponse`
- JSON-LD `Product` schema on each product page (price, availability, image)

**Packages:** (none new — Next.js 14 metadata API handles this natively)

**Effort:** 🟢 Small

---

### 12. CI/CD pipeline

**What:** A GitHub Actions workflow that runs lint, type-check, and tests on every push
and pull request.

**Why:** Currently there is no automated gate. Broken code can be pushed directly to main.

**Approach:**
- `.github/workflows/ci.yml`: runs `npm run lint`, `tsc --noEmit`, `npm test`
- Optional: Vercel preview deployments on PRs (already built into Vercel)

**Packages:** (none — GitHub Actions YAML only)

**Effort:** 🟢 Small

---

## 🟢 Tier 3 — Growth features (add when ready to scale)

These are valuable but not urgent for the initial launch.

---

### 13. Discount codes / promo codes

**What:** Allow customers to apply a coupon code at checkout for a percentage or
fixed-amount discount.

**Why:** Discount codes are a standard e-commerce marketing tool (launch offers, influencer
codes, return-customer rewards).

**Approach:**
- Create Stripe Coupons in the Dashboard
- Add a coupon input field to the checkout page
- Pass `discounts: [{ coupon: code }]` to `stripe.checkout.sessions.create`

**Packages:** (none new — Stripe SDK already installed)

**Effort:** 🟢 Small

---

### 14. Product search

**What:** A search bar that returns products matching a text query (name, description, category).

**Why:** As the catalogue grows beyond 6 items, customers need a way to find specific figures.

**Approach:**
- Simple: client-side fuzzy search with **Fuse.js** over the product array (free, zero infra)
- Advanced: **Algolia** or Postgres full-text search when using a database (Upgrade 1)

**Packages:** `fuse.js` (simple) or `algoliasearch` (advanced)

**Effort:** 🟢 Small (Fuse.js) / 🟡 Medium (Algolia)

---

### 15. Wishlist

**What:** A "Save for Later" button on product cards that persists a list of desired figures.

**Why:** Many customers browse before buying. A wishlist keeps them engaged and can be
used to email them a reminder.

**Approach:**
- Guest wishlist: store in localStorage (similar to cart, using Zustand)
- Authenticated wishlist: stored in database linked to user account (requires Upgrade 6)

**Packages:** (none new — extend Zustand store)

**Effort:** 🟢 Small (guest) / 🟡 Medium (auth-backed)

---

### 16. Customer product reviews

**What:** A star rating and text review system on product detail pages.

**Why:** User-generated social proof significantly increases conversion for handmade/
bespoke items where buyers need to trust the quality.

**Approach:**
- Requires Upgrade 1 (database) and Upgrade 6 (auth — only verified purchasers can review)
- Schema: `Review { productId, userId, rating, body, createdAt }`
- Moderated: admin approves reviews before they go live (see Upgrade 8)

**Packages:** (none new)

**Effort:** 🟡 Medium

---

### 17. Analytics

**What:** Track page views, product views, add-to-cart events, and checkout funnel
drop-off.

**Why:** You need data to understand what's selling, where customers drop off, and which
marketing copy is working.

**Approach:**
- **Vercel Analytics** — zero-config, privacy-friendly, free tier available
- **PostHog** — self-hostable, product analytics + session replay
- Add `<Analytics />` component to `layout.tsx`

**Packages:** `@vercel/analytics` or `posthog-js`

**Effort:** 🟢 Small

---

### 18. Accessibility (a11y) audit and fixes

**What:** Run automated accessibility checks and fix any issues (missing ARIA labels,
colour contrast failures, keyboard-navigation gaps).

**Why:** Legal requirement in many markets (UK Equality Act, EU Accessibility Act).
Also improves SEO.

**Approach:**
- Install `@axe-core/react` in development mode for in-browser feedback
- Run `axe` in Playwright/Cypress E2E tests for automated gates
- Fix any reported issues (focus rings, alt text, button roles)

**Packages:** `@axe-core/react`, `@axe-core/playwright`

**Effort:** 🟡 Medium

---

### 19. Internationalisation (i18n)

**What:** Support multiple languages (initially English + Spanish/French to match the
Packlink shipping destinations already listed).

**Why:** The shop ships to France, Spain, Germany, etc. but the UI is English-only.

**Approach:**
- Add **next-intl** for message-based translations
- Create `messages/en.json`, `messages/fr.json`, `messages/es.json`
- Wrap routes under `[locale]` segment

**Packages:** `next-intl`

**Effort:** 🔴 Large (touches every UI string)

---

### 20. Progressive Web App (PWA)

**What:** Make the site installable as a home-screen app and allow the cart to work
offline.

**Why:** Mobile-first buyers benefit from an app-like experience and offline browsing.

**Approach:**
- Add `next-pwa` (or `@ducanh2912/next-pwa`) for service-worker generation
- Cache static assets and product pages
- Persist cart to IndexedDB for true offline access

**Packages:** `@ducanh2912/next-pwa`

**Effort:** 🟡 Medium

---

## Summary table

| # | Upgrade | Tier | Effort | Depends on |
|---|---|---|---|---|
| 1 | Database + order persistence | 🔴 Critical | 🔴 Large | — |
| 2 | Transactional email | 🔴 Critical | 🟡 Medium | — |
| 3 | Cart clear on success | 🔴 Critical | 🟢 Small | — |
| 4 | Real product images | 🔴 Critical | 🟢 Small | — |
| 5 | Packlink label creation | 🔴 Critical | 🟡 Medium | #1 |
| 6 | User authentication | 🟡 Important | 🟡 Medium | — |
| 7 | Order history page | 🟡 Important | 🟢 Small | #1, #6 |
| 8 | Admin panel | 🟡 Important | 🔴 Large | #1, #6 |
| 9 | Redis rate limiter | 🟡 Important | 🟢 Small | — |
| 10 | Test suite | 🟡 Important | 🟡 Medium | — |
| 11 | SEO (sitemap, OG, JSON-LD) | 🟡 Important | 🟢 Small | — |
| 12 | CI/CD pipeline | 🟡 Important | 🟢 Small | — |
| 13 | Discount codes | 🟢 Growth | 🟢 Small | — |
| 14 | Product search | 🟢 Growth | 🟢 Small | — |
| 15 | Wishlist | 🟢 Growth | 🟢 Small | — |
| 16 | Product reviews | 🟢 Growth | 🟡 Medium | #1, #6 |
| 17 | Analytics | 🟢 Growth | 🟢 Small | — |
| 18 | Accessibility audit | 🟢 Growth | 🟡 Medium | — |
| 19 | Internationalisation | 🟢 Growth | 🔴 Large | — |
| 20 | PWA | 🟢 Growth | 🟡 Medium | — |

---

## Recommended launch sequence

```
Week 1-2:  #3 (cart clear) → #4 (images) → #9 (Redis rate limit) → #11 (SEO) → #12 (CI/CD)
Week 3-4:  #1 (database) → #5 (Packlink labels) → #2 (email)
Week 5-6:  #6 (auth) → #7 (order history) → #10 (tests)
Post-launch: #8 (admin) → #13, #14, #15, #17 (growth features)
Later:     #16, #18, #19, #20
```

---

*To action any item, say which number(s) you want implemented and Copilot will build them.*
