# 5iveArts Web

Next.js 14 e-commerce website for selling hand-painted and home 3D-printed action figures, with **Stripe** payments and **Packlink** shipping.

## Features

- 🎨 **Hand-Painted & 3D-Printed** product catalogue
- 🛒 Persistent shopping cart (Zustand + localStorage)
- 💳 **Stripe Checkout** — server-side session creation, webhook with signature verification
- 📦 **Packlink API** — live shipping rate lookup and label creation
- 🔒 **Security hardened** — CSP, HSTS, X-Frame-Options, rate limiting on all API routes, input validation
- 🧩 **Modular marketing components** — HeroSection, FeaturesSection, FeaturedProducts, TestimonialsSection, CtaSection

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your Stripe and Packlink keys
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Set up Stripe webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret printed by the CLI and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts          # Stripe checkout session (rate-limited)
│   │   ├── packlink/rates/route.ts    # Packlink shipping rates (rate-limited)
│   │   └── webhooks/stripe/route.ts  # Stripe webhook (signature-verified)
│   ├── cart/page.tsx
│   ├── checkout/
│   │   ├── page.tsx
│   │   ├── success/page.tsx
│   │   └── cancel/page.tsx
│   └── products/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── marketing/          # Modular, reusable marketing sections
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── CtaSection.tsx
│   ├── cart/
│   ├── layout/
│   └── product/
├── lib/
│   ├── packlink.ts         # Packlink API client
│   ├── products.ts         # Product catalogue + helpers
│   ├── rateLimit.ts        # Sliding-window rate limiter
│   ├── stripe.ts           # Stripe client
│   └── validate.ts         # Input validation/sanitisation helpers
├── store/cart.ts           # Zustand cart store
└── types/index.ts
```

## Security

| Layer | Measure |
|---|---|
| HTTP Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| API Rate Limiting | Sliding-window per IP on `/api/checkout` (10 req/min) and `/api/packlink/rates` (20 req/min) |
| Input Validation | All API inputs sanitised and validated server-side before use |
| Stripe Webhook | `stripe.webhooks.constructEvent` signature verification on every request |
| Price Integrity | Cart prices are **never trusted from the client** — always re-fetched from the server catalogue |

## Deployment

Deploy on [Vercel](https://vercel.com) for zero-config Next.js support.  
Set all environment variables from `.env.example` in the Vercel project settings.

> **Note:** For multi-instance production deployments, replace the in-memory rate limiter in `src/lib/rateLimit.ts` with a Redis-backed solution (e.g. [@upstash/ratelimit](https://github.com/upstash/ratelimit)).
