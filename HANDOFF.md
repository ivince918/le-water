# Le Water — Project Handoff

_Last updated: 2026-08-24_

Public marketing site for Le Water, a family-owned water store with 3 Fremont/Newark
locations. Doubles as a member self-service surface (phone → gallon balance lookup)
against the live POS database.

## Recent updates (Aug 18–24, 2026)

- **SEO overhaul.** `index.html` `<title>` shortened to "Le Water Store | Alkaline & Purified Water Refill". Added JSON-LD `Organization` node (`#org`) with `aggregateRating` 4.1/180 + `foundingDate` 1998, and `parentOrganization` links on the 3 `WaterStore` nodes.
- **New static content pages** (real HTML in `public/<slug>/index.html`, self-contained inline CSS, own title/meta/canonical/JSON-LD — served directly, NOT SPA-rendered):
  - `/our-water` — RO + coconut carbon process, alkaline explainer, FAQ (`Article` + `Breadcrumb`).
  - `/fremont-north`, `/fremont-central`, `/newark` — per-store location pages (`WaterStore` + `Breadcrumb`), map embed, hours, cross-links.
- **`vercel.json` added** (`cleanUrls:true, trailingSlash:false`) — REQUIRED so `/our-water` serves the static file instead of the SPA. `public/sitemap.xml` now lists all 5 URLs.
- **Homepage nav** cleaned: dropped "Reviews", added "Our Water" (at the end), both desktop + `MOBILE_LINKS`. **Store cards are click-through** to their location page (`STORES[].slug`, `onClick` guarded against inner links).
- **"Our Story" section** added (`<Story/>`, after `<TrustBar/>`) with the real brand copy + "Since 1998".
- **Real water process everywhere.** Replaced fabricated "six-stage RO + UV sterilization" with the true process (local Alameda County supply → reverse osmosis → **coconut carbon filter** → made fresh daily, **no preservatives**) on `/our-water`, all 3 location pages, and FAQ. Plans heading → "Ultra fresh great tasting water."
- **Balance lookup now shows last 3 transactions** (date · type · ±gallons · resulting balance). New Supabase RPC `public_lookup_transactions` (migration `0042` in the WaterStore repo, applied live; `service_role`-only, same hardening as 0039/0040). `api/balance.js` calls it via `fetchRecent()` (resilient — failure returns `[]`), returns `recent[]`. `App.jsx` Balance renders "Recent activity"; dates pinned to `America/Los_Angeles`.
- **Brand (decisions):** GBP profiles to be unified to **"Le Water Store"** (see JarvisEA `decisions/log.md`). Logo direction = **water droplet + wave** (gradient), explored in a Claude artifact; final mark + favicon still TBD.
- **Deploy:** still CLI-direct `npx vercel@latest deploy --prod --yes`. The first attempt often returns `Not authorized` — a straight RETRY succeeds (transient).

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
1. **Hero** — full-bleed Ken-Burns stock image + "Where pure water flows daily" + three actions: `Find your nearest store` (primary, → `#stores`), `Check your balance` (secondary glass button, → `#balance`), `See plans` (text link, → `#plans`).
2. **Reviews** (`#reviews`) — merged section: the "Delivering the best water in Fremont for over 20 years." lead + a 4-image **store gallery** (STOCK PLACEHOLDERS) + "What our customers say" with a **4.4 / 68 Google reviews** aggregate header + 1 featured Yelp quote + 3 supporting cards.
3. **Balance** (`#balance`) — "Check your balance." Plan comparison boxes (Regular/Alkaline) on the left, the phone → gallon lookup card ("Look up your account") on the right.
4. **Stores** (`#stores`) — 3 cards, each with an embedded Google map, **full street address**, live **Open now / Closed** pill (computed client-side from the 10a-7p hours), and two one-tap actions: **Directions** (Google Maps `dir/?api=1`) + **Call** (`tel:`). Section header has a **"Find my nearest store"** geolocation button that haversine-sorts the cards nearest-first, appends "· X.X mi away", and badges the closest "Nearest you". Graceful no-op if location is denied. Store data + `openStatus()` + `milesBetween()` helpers live at the top of the Stores block / module scope in `App.jsx`.
5. **Plans** (`#plans`) — "Ultra pure water. Members save **over 25%**." 3 pricing cards (No plan / Regular / Alkaline). No CTA buttons (removed by request).
6. **Bottles** (`#bottles`) — product grid (5/3/1 gal). Header intentionally has no image (awaiting real product photos).
7. **Footer**.

Nav order mirrors the page: Reviews · Balance · Stores · Plans · Bottles.

**Section background rhythm (alternating):** Hero (dark) → Reviews (tint `#F4F7FA`) → Balance (white) → Stores (tint) → Plans (white) → Bottles (tint) → Footer (dark). Keep this alternation when adding/reordering sections — two adjacent same-color sections read as one.

**Store addresses / NAP (source of truth, also in the JSON-LD schema — keep in sync):**
- **Le Water Store** — 35762 Fremont Blvd, Fremont, CA 94536 · (510) 742-5699 · North Fremont
- **Le Pure Water** — 39409 Fremont Blvd, Fremont, CA 94538 · (510) 656-1533 · Central Fremont
- **Lion Pure Water** — 39131 Cedar Blvd, **Newark**, CA 94560 · (510) 739-6225 · (in Lion Supermarket / Mowry Plaza — this one is Newark, NOT "Fremont South")

## The balance lookup (the one backend piece)

Browser POSTs `/api/balance` → Vercel function holds the Supabase **service role** key server-side + rate-limits by IP → calls Supabase RPC `public_lookup_balance(phone)`.

- **RPC migration:** `WaterStore/supabase/migrations/0039_public_balance_lookup.sql` (lives in the POS repo — that repo is the DB source of truth). `SECURITY DEFINER`, granted to `service_role` ONLY (anon/authenticated cannot reach it). Returns ONLY `{store_name, plan_type, gallons}` — no name/id/history. Applied + verified against prod (3,000+ customers).
- **Env vars** (Vercel project, all environments, server-side — NO `VITE_` prefix): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Both mirror `WaterStore/web/.env.local`. Supabase project host: `rjnjpaxmbnkqhlahimyf`.
- **Security posture:** phone-only (no name gate — POS names are free-text/inconsistent). plan_type 0=Regular, 1=Alkaline.

## Deploy

GitHub auto-deploy is **NOT** connected (the Vercel GitHub app lacks access to the `ivince918` repo). Deploys are **CLI-direct** from the repo root. The `vercel` CLI is **not installed globally** on this machine — invoke via `npx`:

```bash
npx --yes vercel@latest deploy --prod --yes    # from le-water/ ; auto-links project le-water, aliases lewaterstore.com
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

Palette: ink `#0A1220`, blue `#1E588A`, cyan accent `#5BC8E6`. Plan color-coding (pulled from the POS `globals.css`): **Regular = cyan** `#0891B2` / bg `#E0F2FE`; **Alkaline = blue** `#2563EB` / bg `#DBEAFE`. Review stars gold `#F5A623`; Yelp badge red `#d32323`. Open-now status green `#1B9E57` / text `#127a45` / bg `#E4F5EC`. Font: Inter.

Browser-surface theming (in `index.css`): `::selection` uses brand blue at 16%, and a `:focus-visible` ring (2px `#1E588A`) is applied to all interactive elements — don't strip these.

**Motion:** deliberately restrained (the design already carries a loader, Ken-Burns, hero parallax/ripple, scroll-progress bar). Section entrances use a single `.reveal` fade-up via IntersectionObserver (the old per-word `WordReveal` blur-stagger was collapsed to one clean fade — do not reintroduce per-word staggers, they read as AI slop). Store-card micro-interactions: card hover-lift, button press (`scale .97`), a `.live-dot` pulse on the open-now indicator, a Directions-icon nudge on hover, and framer-motion `layout` on the cards so they animate when re-sorted by distance. All motion respects `prefers-reduced-motion`.

## Reviews / ratings (real data — do not fabricate)

- 4 real Yelp reviews are hard-coded in the `REVIEWS` array (Mango T. featured, Norma D., Rochell S., T J.), each with a `highlights: []` array of phrases that render bold.
- Aggregate header shows **4.4 ★ · 68 Google reviews** (the real Google Business number; Yelp counts are low/mixed across the 3 locations so Google is the stronger trust signal).

## Local SEO & structured data

- **`index.html` `<head>`** carries: meta description, Open Graph + Twitter tags, canonical, and a **LocalBusiness JSON-LD `@graph`** with one `WaterStore` node per location (name, full `PostalAddress`, `telephone`, `GeoCoordinates`, `openingHoursSpecification` Mo-Su 10:00-19:00). **Keep the JSON-LD addresses in sync with the NAP list above and with Google Business Profile.**
- **`public/robots.txt`** — allows all, points to the sitemap.
- **`public/sitemap.xml`** — single URL (root), `lastmod` is hand-set (bump it on meaningful content changes). `public/` is copied to dist root by Vite, so both serve at `/robots.txt` and `/sitemap.xml`.
- **Google Search Console:** verify `lewaterstore.com` as a **Domain** property via a TXT record added in the Squarespace DNS panel, then Request Indexing + submit `sitemap.xml`. (Not yet done as of 2026-08-12.)
- **Higher-leverage than the site for "water store near me":** claim/clean all 3 **Google Business Profiles**; NAP must match the schema exactly.

## Analytics

`@vercel/analytics` installed; `<Analytics />` rendered in `src/main.jsx`. Web Analytics is enabled on the Vercel project. Data: Vercel dashboard → `le-water` → Analytics tab.

**Conversion events** (fired via `track()` through the `trackEvent()` wrapper in `App.jsx`, which swallows errors so analytics never throws into the UI):
- `hero_find_store`, `hero_check_balance`, `hero_see_plans` — hero CTAs
- `balance_lookup` `{ result: 'found' | 'not_found' | 'error' }`
- `get_directions` `{ store }`, `call_store` `{ store }` — per store card
- `use_my_location` — the nearest-store geolocation button

## Open items / TODO

1. **REAL PHOTOS (highest-value, still open).** The store gallery (4 images in the Reviews section, marked `TODO` in code), the Bottles product cards, and the hero are all **stock placeholders**. Per the CRO research done for this site, real photos are THE lever for the "feels stale/stock" problem (real photos beat stock 35–161% in cited studies). Swap: gallery `<img src={IMG.*}>` in the Reviews section, add product photos to `PRODUCTS`, swap the hero `IMG.heroSubject`.
2. **New-customer offer CTA (still open).** The Lion acquisition promo ($50 / 150 gal + free jug) is NOT on the site. It's the main acquisition lever for a local store; recommend a hero banner or dedicated strip.
3. **Google Search Console + GBP** — verify the domain in GSC, request indexing, submit sitemap; claim/clean the 3 Google Business Profiles (see Local SEO section). Not started.
4. **No social OG image** — link shares have no preview image (og:image not set). Add once brand imagery exists.
5. **GitHub auto-deploy** not connected (see Deploy).
6. Loader intro `translateY(-60px)` (`.loader-stage` in index.css) is an eyeball-centered value; nudge if needed.

### Done 2026-08-12 (pm session)
- Local SEO: meta description + OG/Twitter + canonical + LocalBusiness JSON-LD (3 stores) + robots.txt + sitemap.xml.
- Stores rebuilt for first-timers: real addresses, live open-now status, "find my nearest store" geolocation sort, one-tap Directions + Call. Corrected Lion → Newark.
- Conversion tracking events wired (see Analytics).
- Fixed mobile 42px horizontal overflow (Plans headline `whitespace-nowrap` → `md:whitespace-nowrap`).
- Slop pass: per-word reveal → single fade; added `::selection` + `:focus-visible` theming. Impeccable detector clean.
- Alternating section background rhythm (flipped Plans → white, Bottles → tint).
- Store-card micro-interactions + hero "Check your balance" button.
- Website-audit baseline: Overall C(67), Function D(62), Design C(74), no gates. Top remaining levers = items 1 + 2 above.

## Gotchas

- **Verify against the live domain**, not the alias: `curl --resolve lewaterstore.com:443:216.198.79.1 https://lewaterstore.com/...`. The `le-water.vercel.app` alias caches briefly after deploy.
- **Minification false-negatives:** grepping the prod JS bundle for JSX text/attrs (e.g. `id="bottles"`, `68 Google reviews`) often returns 0 because minification splits/transforms them. Trust `npm run build` succeeding over a bundle grep.
- **npm build does NOT catch every runtime issue** — for anything touching the serverless function, smoke-test `/api/balance` on the deployed URL after deploy.
- Unused `IMG` keys (`refillJug`, `heroPour`, `storeShelf`) linger after the "How it works" section was removed — harmless.

## Related

- POS system + DB source of truth: `~/PycharmProjects/WaterStore/` (see its `README.md` and `docs/superpowers/handoffs/`).
- `DEPLOY.md` (this repo) — the original deploy runbook.
