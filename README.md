# Holiday Christmas Lighting · Lake Forest

Vite + React site with a 5-step booking calendar, Stripe deposit checkout, and a Cloudflare Worker + D1 backend.

| | |
|---|---|
| Source tag | `hcl-lakeforest` |
| Booking ID prefix | `HCL-` (e.g. `HCL-7K3F9Q`) |
| Worker name | `hcl-lakeforest-api` |
| Pages project | `holiday-lighting-lake-forest` |
| D1 table | `bookings` (shared columns, unchanged) |

---

## 1. Before launch — fill these TODOs

All in **`src/data/business.js`** unless noted:

- [ ] `PACKAGES[].startingAt` — Front Only / Front & Sides starting prices (currently `null` → shows "Priced at your on-site visit")
- [ ] `ADDONS[].price` — tree wrap, wreaths, pathway, customer-owned install, storage (currently `null` → "Quoted at visit")
- [ ] `REVIEWS` / `RATING` — **real** reviews only (section shows a neutral message while empty)
- [ ] `BUSINESS.googleReviewUrl` — GBP review link
- [ ] `SERVICE_AREA` — confirm the city list (also update `areaServed` in `index.html`)
- [ ] `src/components/Gallery.jsx` — add real day + night install photos (illustrations are placeholders, labeled "Sample illustration")
- [ ] Custom domain: replace `holiday-lighting-lake-forest.pages.dev` in `index.html` (canonical, OG, JSON-LD), `BUSINESS.siteUrl`, and `DEFAULT_ORIGINS` in `worker/worker.js`

If you change the season dates, time windows, 48-hour lead time or the $149 deposit, change them in **both** `src/data/business.js` and the top of `worker/worker.js`.

---

## 2. Run locally (Windows CMD)

```cmd
cd C:\path\to\holiday-lighting-lake-forest
npm install
copy .env.example .env.local
notepad .env.local
npm run dev
```

`.env.local` needs:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE=https://hcl-lakeforest-api.<your-subdomain>.workers.dev
```

Open http://localhost:5173

---

## 3. Push to GitHub (Windows CMD)

Create an empty repo named `holiday-lighting-lake-forest` under **servicepros714** on github.com first, then:

```cmd
cd C:\path\to\holiday-lighting-lake-forest
git init
git add .
git commit -m "Holiday Christmas Lighting Lake Forest site"
git branch -M main
git remote add origin https://github.com/servicepros714/holiday-lighting-lake-forest.git
git push -u origin main
```

`.env.local` is git-ignored; the build gets its keys from GitHub secrets (step 6).

---

## 4. D1 (Cloudflare dashboard)

Use the **same shared D1 database** as the other sites so the admin dashboard sees these bookings.

1. Workers & Pages → D1 → open the shared database → **Console**.
2. Paste and run `worker/schema.sql` (safe to re-run; it uses `IF NOT EXISTS`).

The Worker also creates the table/index on first use, but it never lets that step block a payment.

---

## 5. Worker (Cloudflare dashboard)

1. Workers & Pages → **Create** → Worker → name it `hcl-lakeforest-api` → Deploy.
2. **Edit code** → delete the sample → paste all of `worker/worker.js` → **Deploy**.
3. Worker → **Settings → Bindings** → Add → **D1 database** → variable name `DB` → pick the shared database.
4. **Settings → Variables and Secrets**:
   - Secret `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...` while testing)
   - Secret `ADMIN_TOKEN` = a long random string (only needed if the dashboard uses this Worker's GET/PATCH routes)
   - Text `ALLOWED_ORIGINS` = your custom domain and admin dashboard origin, comma-separated (pages.dev and its preview URLs are already allowed)
5. Check it: open `https://hcl-lakeforest-api.<your-subdomain>.workers.dev/api/health`

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | Booked counts per date + window, `AND source = 'hcl-lakeforest'` |
| POST | `/api/create-payment-intent` | Fixed $149 PaymentIntent, `automatic_payment_methods[enabled]=true` |
| POST | `/api/bookings` | `payment_status` `Paid` (PaymentIntent verified with Stripe, idempotent) or `Pay Later` |
| GET | `/api/bookings` | Admin (`Authorization: Bearer <ADMIN_TOKEN>` or `X-Admin-Key`) |
| PATCH | `/api/bookings/:id` | Admin. Patchable: `status, reschedule_date, reschedule_time, notes2, original_date, original_time, payment_status, date, time` |

### How bookings land in D1

| Column | Example |
|---|---|
| `id` | `HCL-7K3F9Q` |
| `date` / `time` | `2026-11-12` / `12PM–4PM` |
| `service` | `Front & Sides` |
| `vehicle` | `2-Story · Front & Sides · +Wreaths, +Pathway` |
| `notes` | `Add-ons: … \| Est. starting price: … \| Deposit $149 paid (pi_…)` |
| `source` | `hcl-lakeforest` |
| `status` | `Booked` |
| `payment_status` | `Paid` or `Pay Later` |

---

## 6. Pages + GitHub Actions deploy

1. Cloudflare dashboard → Workers & Pages → **Create** → Pages → **Upload assets** (Direct Upload) → project name `holiday-lighting-lake-forest` → upload any placeholder folder once to create the project.
2. Cloudflare dashboard → My Profile → **API Tokens** → Create token with **Cloudflare Pages: Edit** permission. Copy your **Account ID** from the Workers & Pages overview.
3. GitHub repo → Settings → **Secrets and variables → Actions** → New repository secret:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
   - `VITE_API_BASE` (`https://hcl-lakeforest-api.<your-subdomain>.workers.dev`)
4. Push to `main` (or Actions → Deploy to Cloudflare Pages → Run workflow). `.github/workflows/deploy.yml` builds and deploys `dist/`.

`public/_redirects` (`/* /index.html 200`) makes `/book`, `/checkout` and `/confirmation` load on refresh.

---

## 7. Stripe

- Dashboard → Settings → Payment methods: turn on cards plus Apple Pay / Google Pay / Link as wanted (the site uses automatic payment methods).
- Apple Pay on a custom domain: Settings → Payment method domains → add the domain.
- Test card: `4242 4242 4242 4242`, any future date, any CVC.

---

## Layout used on this site (uniqueness record)

Palette from logo: evergreen `#01380B`, pine `#011A06`, gold `#FDC736`, pale gold `#FDEE85`, berry `#AF0001`, ivory `#FBF6E6` · Fonts: Fraunces + Manrope + Pinyon Script · Nav: berry info strip + centered-emblem split nav · Hero: card-overlay booking widget over a lit-street skyline · Order: Hero → Season countdown → Tabbed packages → How it works → Day/Night slider → Reviews → Service area → FAQ → Final CTA · Packages: tabbed with add-on table · Gallery: before/after day-vs-night slider · Motion: light-string line draws + soft twinkle · Footer: centered stacked.
