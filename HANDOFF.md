# Le Water — Project Handoff

_Last updated: 2026-08-12_

Public marketing site for Le Water, a family-owned water store with 3 Fremont/Newark
locations. Doubles as a member self-service surface (phone → gallon balance lookup)
against the live POS database.

## Live

- **Production:** https://lewaterstore.com (custom domain, valid SSL, `www` 308→apex)
- **Vercel URL:** https://le-water.vercel.app
- **Repo:** https://github.com/ivince918/le-water (branch `main`)
- **Vercel project:** `le-water` (`prj_WA6aoheqXmr7knCsdzZlbsh8gEAH`), team `team_fKZILZIFhpn74BjfMnb5c52s` (same team as the `waterstore` POS project)

## Stack

- **Vite + React 18** SPA, Tailwind (v3) + a small `src/index.css` of custom classes, framer-motion, lucide-react.
- One serverless function: `api/balance.js` (Vercel Node function, auto-deployed from the `api/` dir).
- Supabase Postgres backend (the SAME project as the POS).
- Vercel Web Analytics (`@vercel/analytics`).

## Page structure (order matters — front-loaded by visitor intent)

`src/App.jsx` renders, in order:
1. **Hero** — full-bleed Ken-Burns stock image + "Where pure water flows daily" + "Find your nearest store" CTA.
2. **Reviews** (`#reviews`) — merged section: the "Delivering the best water in Fremont for over 20 years." lead + a 4-image **store gallery** (STOCK PLACEHOLDERS) + "What our customers say" with a **4.4 / 68 Google reviews** aggregate header + 1 featured Yelp quote + 3 supporting cards.
3. **Balance** (`#balance`) — "Check your balance." Plan comparison boxes (Regular/Alkaline) on the left, the phone → gallon lookup card ("Look up your account") on the right.
4. **Stores** (`#stores`) — 3 cards: embedded Google map, hours, tap-to-call phone, Get directions.
5. **Plans** (`#plans`) — "Ultra pure water. Members save **over 25%**." 3 pricing cards (No plan / Regular / Alkaline). No CTA buttons (removed by request).
6. **Bottles** (`#bottles`) — product grid (5/3/1 gal). Header intentionally has no image (awaiting real product photos).
7. **Footer**.

Nav order mirrors the page: Reviews · Balance · Stores · Plans · Bottles.

## The balance lookup (the one backend piece)

Browser POSTs `/api/balance` → Vercel function holds the Supabase **service role** key server-side + rate-limits by IP → calls Supabase RPC `public_lookup_balance(phone)`.

- **RPC migration:** `WaterStore/supabase/migrations/0039_public_balance_lookup.sql` (lives in the POS repo — that repo is the DB source of truth). `SECURITY DEFINER`, granted to `service_role` ONLY (anon/authenticated cannot reach it). Returns ONLY `{store_name, plan_type, gallons}` — no name/id/history. Applied + verified against prod (3,000+ customers).
- **Env vars** (Vercel project, all environments, server-side — NO `VITE_` prefix): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Both mirror `WaterStore/web/.env.local`. Supabase project host: `rjnjpaxmbnkqhlahimyf`.
- **Security posture:** phone-only (no name gate — POS names are free-text/inconsistent). plan_type 0=Regular, 1=Alkaline.

## Deploy

GitHub auto-deploy is **NOT** connected (the Vercel GitHub app lacks access to the `ivince918` repo). Deploys are **CLI-direct** from the repo root:

```bash
vercel deploy --prod --yes     # from le-water/ ; auto-links project le-water
```

- **Auth:** the Vercel CLI OAuth token in `~/Library/Application Support/com.vercel.cli/auth.json` is NOT valid as `VERCEL_TOKEN` for the CLI — **let the CLI use its native auth; do NOT set `VERCEL_TOKEN`**. That SAME token DOES work as a `Bearer` against `api.vercel.com` REST (used it to toggle deployment protection + read project state).
- **Deployment protection:** disabled (`ssoProtection: null`) so the public site + `/api/balance` are reachable.
- **To connect GitHub auto-deploy later:** grant Vercel's GitHub app access to `ivince918/le-water` in Vercel project settings; then pushes ship automatically and CLI deploys become optional.

### DNS (already configured)

Domain registered at **Squarespace** (ex-Google Domains); nameservers are **Google Cloud DNS** (`ns-cloud-*.googledomains.com`). Records set in the Squarespace DNS panel:
- `A @` → `216.198.79.1` and `64.29.17.1`
- `CNAME www` → `cname.vercel-dns.com.`
- (Google's default `A`/`AAAA @` parking records were removed.)

## Design system (single source of truth)

`src/index.css` holds the primitives. **All headings** are `display` + a tier class — do not use inline `text-[clamp(...)]` for headings:
- `.h-hero` — the one hero headline
- `.h-title` — every section title (`clamp(2.2rem,5vw,3.8rem)`)
- `.h-lead` — the one-line lead/tagline
- `.h-sub` — sub-headings (currently unused but kept as a tier)

Spacing standard: sections `py-24 md:py-32 px-6 md:px-10`, container `max-w-[1240px]`, section-header margin `mb-12 md:mb-16`.

Palette: ink `#0A1220`, blue `#1E588A`, cyan accent `#5BC8E6`. Plan color-coding (pulled from the POS `globals.css`): **Regular = cyan** `#0891B2` / bg `#E0F2FE`; **Alkaline = blue** `#2563EB` / bg `#DBEAFE`. Review stars gold `#F5A623`; Yelp badge red `#d32323`. Font: Inter.

## Reviews / ratings (real data — do not fabricate)

- 4 real Yelp reviews are hard-coded in the `REVIEWS` array (Mango T. featured, Norma D., Rochell S., T J.), each with a `highlights: []` array of phrases that render bold.
- Aggregate header shows **4.4 ★ · 68 Google reviews** (the real Google Business number; Yelp counts are low/mixed across the 3 locations so Google is the stronger trust signal).

## Analytics

`@vercel/analytics` installed; `<Analytics />` rendered in `src/main.jsx`. Web Analytics is enabled on the Vercel project. Data: Vercel dashboard → `le-water` → Analytics tab.

## Open items / TODO

1. **REAL PHOTOS (highest-value).** The store gallery (4 images in the Reviews section, marked `TODO` in code), the Bottles product cards, and the hero are all **stock placeholders**. Per the CRO research done for this site, real photos are THE lever for the "feels stale/stock" problem (real photos beat stock 35–161% in cited studies). Swap: gallery `<img src={IMG.*}>` in the Reviews section, add product photos to `PRODUCTS`, swap the hero `IMG.heroSubject`.
2. **New-customer offer CTA** — the Lion acquisition promo ($50 / 150 gal + free jug) is NOT on the site. It's the main acquisition lever for a local store; recommend a hero banner or dedicated strip.
3. **GitHub auto-deploy** not connected (see Deploy).
4. Loader intro `translateY(-60px)` (`.loader-stage` in index.css) is an eyeball-centered value; nudge if needed.

## Gotchas

- **Verify against the live domain**, not the alias: `curl --resolve lewaterstore.com:443:216.198.79.1 https://lewaterstore.com/...`. The `le-water.vercel.app` alias caches briefly after deploy.
- **Minification false-negatives:** grepping the prod JS bundle for JSX text/attrs (e.g. `id="bottles"`, `68 Google reviews`) often returns 0 because minification splits/transforms them. Trust `npm run build` succeeding over a bundle grep.
- **npm build does NOT catch every runtime issue** — for anything touching the serverless function, smoke-test `/api/balance` on the deployed URL after deploy.
- Unused `IMG` keys (`refillJug`, `heroPour`, `storeShelf`) linger after the "How it works" section was removed — harmless.

## Related

- POS system + DB source of truth: `~/PycharmProjects/WaterStore/` (see its `README.md` and `docs/superpowers/handoffs/`).
- `DEPLOY.md` (this repo) — the original deploy runbook.
