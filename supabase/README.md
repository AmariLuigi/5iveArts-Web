# Supabase Database Setup

Follow these steps when you're at your computer to connect the site to Supabase.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a name (e.g. `5ivearts`), pick a region close to you, and set a strong database password. Save the password somewhere safe.
3. Wait for the project to finish provisioning (~1 minute).

---

## 2. Get your API keys

In the Supabase Dashboard:
1. Click **Project Settings** (the cog icon at the bottom of the left sidebar).
2. Go to **API**.
3. Copy:
   - **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - **anon / public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - **service_role** key (⚠️ secret) → paste as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## 3. Run the database schema migration

In the Supabase Dashboard:
1. Click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/001_schema.sql` from this repository, copy the entire contents, and paste it into the editor.
4. Click **Run** (or press `Cmd/Ctrl + Enter`).
5. You should see `Success. No rows returned` at the bottom.

This creates the `products`, `orders`, and `order_items` tables, indexes, RLS policies, and the `decrement_stock` function.

---

## 4. Seed the products

1. Still in the SQL Editor, click **New query**.
2. Open `supabase/seed.sql`, copy the contents, paste into the editor, and click **Run**.
3. This inserts all 6 products from the catalogue. It is safe to re-run.

---

## 5. Install the Supabase client package

```bash
npm install
```

This installs `@supabase/supabase-js` which was added to `package.json`.

---

## 6. Start the dev server

```bash
npm run dev
```

The site will now use Supabase for order storage. Products are still served from the static catalogue in `src/lib/products.ts` (useful for validation — stock counts are authoritative in the DB).

---

## 7. Deploy to Vercel

1. Push your branch to GitHub.
2. In the Vercel dashboard for this project, go to **Settings → Environment Variables**.
3. Add all three Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) alongside the existing Stripe and Packlink vars.
4. Redeploy.

---

## What the database does right now

| Event | What happens in Supabase |
|---|---|
| `checkout.session.completed` Stripe webhook | Inserts a row in `orders` + rows in `order_items` + decrements `products.stock` |

---

## Future tables (from `UPGRADES.md`)

| Upgrade | New table(s) |
|---|---|
| #6 User auth | `user_profiles` (via Supabase Auth) |
| #16 Reviews | `reviews` |
