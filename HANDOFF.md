# Le Water — Project Handoff

_Last updated: 2026-09-07_

Public marketing site for Le Water, a family-owned water store with 3 Fremont/Newark
locations. Doubles as a member self-service surface (phone → gallon balance lookup)
against the live POS database.

## Recent updates (Sep 6-7, 2026) — full SEO audit, Search Console access, and three real bugs

Full audit in `lewaterstore.com-audit/` (report, action plan, `audit-data.json`, 10 findings
files, 20 screenshots). August artifacts archived under `archive-2026-08-25/`, not overwritten.

### Search Console is now wired up, and it corrected the audit

Tier 1 Google credentials are configured at `~/.config/claude-seo/google-api.json`
(OAuth token + API key). The authorized account holds **siteOwner on five properties**:
`lewaterstore.com`, `ketmarketing.co`, `sweetiicoffee.com`, `vintagecafewestminster.com`,
`hoangleservices.com`. Search Console, URL Inspection, Sitemaps, Indexing API, PageSpeed
and CrUX all work. All free, no billing account required.

**Setup gotcha, will bite again:** the OAuth client lives in Brian's dad's Cloud project
(that project holds the GBP review API allowlist, so a fresh project would mean re-applying).
Dad's Google account `lehiep67@gmail.com` is enrolled in **Advanced Protection**, which
refuses third-party OAuth apps outright — `Error 400: policy_enforced`, unfixable from the
consent screen. The fix is to keep the project but **sign in as `brile761@gmail.com`** at the
account chooser, with that address added under OAuth consent screen → Test users. The app and
the signing-in user are independent.

**First-party data (trailing 28d, pulled 2026-09-07). This contradicts two audit conclusions:**

| Metric | Value |
|---|---|
| Clicks | 59 |
| Impressions | 2,453 |
| CTR | 2.4% |
| Average position | 3.7 |

1. **The legacy names already rank to this site.** "the water spot" position **1.0**,
   "le pure water" **1.9**, "le water store" **3.0**. The audit's SXO pass claimed the domain
   "never surfaced directly, even for its own brand name" — that was inferred from SERP
   composition and is **false**. Yelp ranks *and* the site ranks. The Yelp cleanup drops from
   CRITICAL to MEDIUM: still a data-accuracy problem (the 25c/gal figure is wrong and
   quotable), no longer a ranking blocker.
2. **The problem is CTR, not position.** Brand CTR 6.2%, **non-brand CTR 0.8% across 1,429
   impressions**. Position 3.7 should return 7-11%. The site is shown constantly and not clicked.
3. `/fremont-north` and `/newark` had **zero clicks on 343 combined impressions**.
4. **CrUX returns no data for this origin** (below Google's traffic threshold), so the
   audit's 11.1s mobile LCP is Lighthouse lab simulation and **cannot be validated against
   real users. Do not quote it as a real-world number.**

### Shipped

**`5f12b55` — audit remediation.**
- `public/llms.txt` added, leading with membership, 24-hour vending, balance checker.
  **Do not sell this as a Google or AI Overviews lever.** Google's AI optimization guide
  (2026-06-29) states Search ignores it, including for generative features. It is for
  ChatGPT/Perplexity/Claude coverage only.
- FAQ expanded 6 → 8 questions, reordered so membership, 24-hour vending and the balance
  checker sit at positions 3-5. Schema/visible parity verified for all 8 (Google requires it,
  and it had already drifted on the alkaline answer).
- **Horizontal overflow at 390px fixed.** `.ft-links`, the footer nav, was `display:flex`
  with no `flex-wrap`, totalling 401-404px against a 390px viewport and overflowing 35-38px
  on 4 pages. "Accessibility" was the link breaching the edge. Re-measured: 0px.
- **Font duplication fixed — this was a real bug.** 7 self-hosted woff2 files were only
  **2 unique files** (`md5` identical): the same Inter variable font served 4 times under
  weight-named URLs, Montserrat 3 times. Both are genuine variable fonts (`fvar`/`gvar`/`STAT`),
  so the 7 static `@font-face` rules collapsed to 2 with weight ranges (`400 700`, `500 700`).
  **304KB → 84KB, ~220KB off every cold load.** Verified: requests 7 → 2, all four weights
  still render, hero pixel-equivalent to production.
- `/our-water` Article `headline` said "Reverse Osmosis and Alkaline Water, Explained" while
  the visible `<h1>` said "How we make every gallon". Aligned; old value kept as
  `alternativeHeadline`.

**`eaa837a` — meta descriptions rewritten for CTR.** Driven by the 0.8% non-brand number.
The homepage description was 222 chars against a ~155 cutoff, so "Open daily, with 24-hour
vending outside every store" — the one differentiating line — was cut from every result.

| Page | Was | Now |
|---|---|---|
| home | 222 | 133 |
| `/fremont-north` | 165 | 144 |
| `/fremont-central` | 167 | 145 |
| `/newark` | 163 | 144 |

Price, hours and the vending fact all land inside the first **120 chars**, because that is
where mobile truncates and mobile is 1,527 of 2,453 impressions. Location pages now lead with
a local anchor (Nicolet/Brookvale, the FoodMaxx centre near the Crossroads, Cedar at Cherry in
Lion Supermarket Plaza) instead of repeating the brand already shown in the title.
**Titles deliberately left alone** — brand-led titles were a considered decision in `e8c0642`
and brand CTR (6.2%) does not contradict it.

**Measure this.** Re-pull Search Console in 2-4 weeks and compare non-brand CTR against the
0.8% baseline. Expect partial credit: Google rewrites descriptions roughly half the time.

### Still open from the audit

Highest value first. Full list in `lewaterstore.com-audit/ACTION-PLAN.md`.

- **Heading text concatenates on extraction.** Headings split words across `<span>`/`<br/>`
  with no whitespace, so tag-stripping yields `Where pure waterflows daily`,
  `Frequently askedquestions`, `Le Water StoreWater refill in North Fremont`. Affects the H1
  on 4 pages. Google copes; simpler AI pipelines do not. A space or `&nbsp;` at the boundary
  fixes it with zero visual change.
- **The three owner priorities are all below the fold on every viewport** — membership at
  ~6.6 screens deep on mobile, 24-hour vending with *zero* above-fold presence anywhere.
  Fixing this is a hero redesign: **show Brian a render first.**
- Responsive images are still absent (~2,000ms of recoverable LCP). **Do not simply re-add
  `srcset`** — it was tried and reverted for visibly softening the gallery. Measure the real
  rendered slot sizes first.
- Homepage still has two H1s (prerendered hero + `<noscript>` fallback).
- Same `@id` declared with different properties on homepage vs location pages (`makesOffer`
  on one, legacy `alternateName` on the other). Not fragmentation, but undefined behavior.
- 5 now-unreferenced numbered woff2 files and the dead `public/fonts/fonts.css` were left in
  place for one deploy cycle so cached HTML would not 404. **Safe to delete now.**

### Corrections to earlier findings, so they are not re-reported

- The Google Maps iframes on the location pages **already carry `loading="lazy"`**. The audit's
  performance pass called them eager-loaded; that is wrong. Chrome simply loads lazy iframes
  aggressively on fast connections.
- The balance lookup was flagged "security-weak" by the SXO pass. `DEPLOY.md` documents
  deliberate hardening (service-role only, minimal response with no name/id/history echoed,
  IP rate limiting, tested). Worth a considered privacy review, not an emergency.
- `aggregateRating` is **correctly absent**. Self-serving review markup on
  `Organization`/`LocalBusiness` violates Google policy and Google surfaces the live GBP
  rating anyway. Do not "fix" this.

## Recent updates (Sep 5, 2026) — em dashes out of the page titles

Every page title carried an em dash: `Le Water Store &mdash; Water Refill in Newark, CA`.
Brian asked for a colon instead. Changed on all 8 pages, in `<title>`, `og:title` and
`twitter:title`, plus the homepage `og:image:alt`. Commit `78197bb`, live and verified on
all 8 URLs.

- **Scope was titles only.** The on-page `<h1>`s never had em dashes, so nothing visible on
  the page moved. Body-copy `&mdash;` was left alone deliberately: the legacy-name bullets in
  `/contact`, a few paragraphs in `/privacy` and `/accessibility`, and the noscript store list
  in `index.html`. If those should go too, it is a separate pass.
- Titles are edited in **8 separate files**, not one template. `index.html` is the SPA shell;
  the other seven live at `public/<page>/index.html` and each repeats the string three times.
  Grep for `og:title` before assuming you got them all.

## Recent updates (Aug 30, 2026) — prerender, entity reclaim, section fit

### The build has three steps now. Read this before touching src/.

`npm run build` = `vite build` → `vite build --ssr src/entry-server.jsx --outDir dist-ssr`
→ `node scripts/prerender.mjs`.

`/` was the only page serving `<div id="root"></div>` and nothing else: 0 crawlable
words, 0 images, no NAP, on the priority-1.0 URL. It now ships **890 words, 7 images
and the full NAP** as real HTML.

**Constraints this puts on `src/App.jsx`:**
- **No unguarded `window` / `document` in a render path.** They run in Node during the
  prerender. `useHashRoute` already bit us — its lazy `useState(() => window.location.hash)`
  crashed the build until guarded. `useEffect` bodies are safe; they never run in SSR.
- `src/entry-server.jsx` renders `<App />` without `<Analytics />` (browser-only beacon).
- The prerender **hard-fails the build** if `#root` is not empty or if any of the three
  addresses or phone numbers is missing from the output. That is deliberate — a silent
  regression here is invisible.
- Clock-derived store status ("Open now", "Opens 10 AM", "Closed · opens 10 AM") is
  rewritten to **"Open daily"** in the snapshot. Never bake the clock into crawlable HTML.
  Visitors still get live status — `main.jsx` uses `createRoot`, which clears the
  container on mount, and React takes over by ~400ms on a 4x-throttled CPU.
- Verified visually inert: full-page pixel diff against the pre-prerender build is
  **mean delta 0.0000/255, bbox None**.

**An earlier version used headless Chrome and silently broke production.** It launched
from a hardcoded macOS path, so `npm run build` exited 1 on Vercel's Linux builders and
the deploy errored — while the CLI still printed "Production ready". **Always confirm a
deploy from the build log, not the CLI line:**
`npx vercel inspect <url> --logs | grep -iE "prerender:|Build Completed|error"`.

### Section height budget

Brian's viewport is **1497x745**. The sticky nav is **82px** and paints over whatever
section you scroll to, so the genuinely visible budget is **663px**, not 745.

| section | height @1497 | fits 745 |
|---|---|---|
| gallery | 708 | yes |
| reviews | 726 | yes |
| balance | 848 | no |
| faq | 848 | no |
| plans | 991 | no |
| stores | 1041 | no, **deliberately** |

- The photo gallery is now its own `#gallery` section. It used to live inside `#reviews`,
  eating 548px + a 96px margin, which is why that section was 1723px.
- `#reviews` keeps the **featured card above a row of three**. A four-across row was tried
  and rejected. It fits at 726px by tightening the box, not the layout: padding, card
  padding, quote sizes 26→21px and 15.5→14.5px, internal margins.
- **`#stores` was trimmed to exactly 745px and then reverted on purpose.** Getting there
  needed 100px maps (from 200px) and they were too short to read. 1041px and one small
  scroll is the accepted trade. Do not "fix" this again without asking.

#### Uniform section height was tried and reverted (2026-08-30). Read this before retrying.

The 708-1041 spread is uneven because gallery ran 80px padding and reviews 56px (squeezed
to fit 745) while every other section ran 128px. The fix attempted was a `.slab` class:
`min-height: 950px` + column-flex centring on all seven sections below the hero, 768px and
up. It worked mechanically — all seven landed at exactly 950, spread 0px, page 7558 ->
8119, identical hydrated and JS-disabled, no CLS. It shipped to production and **Brian
reverted it on sight** (`3464921`, reverted by `e3e64c0`).

**Why it failed, and it is not the heights:**

- **The background rhythm carries the section boundaries, and equal heights destroy it.**
  `#gallery` and `#reviews` are *both* tinted and adjacent. At 708+726 that reads as two
  sections; at 950+950 the 1900px tint run reads as one wall. Length variation was doing
  half the work of the alternation.
- Equalising every block removes the other half. Same-length tint/white/tint/white with no
  size cue is flatter than an uneven rhythm, not cleaner.

**So the real constraint, which was undocumented until now:** the homepage alternates
tint (`#F4F7FA`) and white as its section-boundary signal — gallery tint, reviews tint,
balance white, stores tint, plans white, bottles tint, faq white. Note it does **not**
actually alternate: gallery and reviews are a double-tint. That pairing survives only
because the two sections are different heights. **Any height change must re-solve the
backgrounds in the same pass.** Do not hold them constant and hope.

**If this is retried:** fix the double-tint first (give one of gallery/reviews its own
background, or merge them), then equalise, and review **seam screenshots** — the boundary
between two sections — not each section in isolation. Isolated screenshots are what let
this ship; every one of them looked correct.

### Entity reclaim (the legacy names)

GSC showed **"le pure water" pulling 40 impressions/week** with the phrase nowhere on the
site — the rename had scrubbed every mention. All three stores still circulate under old
names across Yelp, Nextdoor, YellowPages, Superpages, Yahoo, MapQuest and Birdeye, and
**exactly one of ~18 directory listings links back to lewaterstore.com**.

Shipped: `alternateName` arrays on every Store node and on Organization carrying
**The Water Spot** (North Fremont, the Lucky's centre), **Le Pure Water** (Central
Fremont, FoodMaxx), **Lion Pure Water** (Newark, Lion Plaza); one "Formerly X." sentence
appended to each location page's existing lead (+27px, no new block); a
"Have we changed names?" section on `/contact` mapping every old name to its store.

Also `max-image-preview:large` + `max-snippet:-1` on all 8 pages, an `ImageObject` for the
existing hero photo (the North Fremont storefront already on the page — nothing swapped)
and a `WebPage` node wiring it as `primaryImageOfPage`.

**Not done:** Yelp `sameAs`. Yelp 403s every request from this machine, so the slugs could
not be verified and a wrong canonical link is worse than none. Add after claiming.

## Recent updates (Aug 25-30, 2026)

**SEO / correctness pass, then a partial revert.** Full detail in the
"SEO / correctness pass" section below — read that plus the first three Gotchas before
touching this site.

- **Schema fixed.** `WaterStore` is not a real Schema.org type; all six store nodes now
  use `Store`. Self-serving `aggregateRating` removed. Three stores were declared under
  six `@id`s — now unified. Added `sameAs`/`hasMap`, `Offer`, `WebSite`, and `FAQPage`
  on `/our-water`.
- **Three false claims removed** from the live site: the "same low per-gallon price for
  members" FAQ answer, the "no days off" hours line, and the bottled-water preservatives
  claim on `/our-water`.
- **Review attribution corrected.** The quote cards are **Yelp**; the 4.1 aggregate is
  **Google**. They had been conflated.
- **Titles now lead with "Le Water Store"** on all 8 pages. The location pages had been
  naming the brand twice.
- **New pages:** `/privacy`, `/contact`, `/accessibility`, linked from every footer.
  Sitemap is 8 URLs.
- **Perf:** self-hosted fonts (killed 834-843ms of render-blocking), correct font
  preloads (the real LCP bug), 367KB of oversized logo/favicon removed, immutable
  caching + security headers in `vercel.json`.
- **Two bugs fixed:** scroll-reveal could strand the FAQ section at `opacity:0` forever,
  and the 2.85s intro curtain ran on every ad click.
- **Reverted:** hero subheadline, spacing tweaks, footer rebuild, homepage `srcset`, the
  static hero, and a 7th FAQ item. The homepage now pixel-diffs at **0.030/255** against
  `07eabf2` — the only differences are the deliberate text corrections and the footer
  legal links.

## Recent updates (Aug 24-25, 2026)

- **All three stores renamed to "Le Water Store"** across every surface: `<title>`, og/twitter tags, page `h1`s, cross-link cards, LocalBusiness schema `name`, the Get-directions links, the Google Maps embed `!2s` labels and the iframe `title` attributes. Zero occurrences of "Le Pure Water" / "Lion Pure Water" remain in source. The embed URLs were re-fetched after relabelling and all return 200 - they resolve by place ID (`!1s0x...`), not by the label, so relabelling is safe.
- **All stock photography is gone.** Real store photos live in `public/photos/` as WebP + JPEG pairs (1000-2200px, generated with Pillow from the GBP-ready sets in `~/Downloads/{lion,foodmaxx,lucky}-photos/gbp-ready/`). This also removed a **hotlink to flowhydration.com's Shopify CDN** (a competitor's product photo served live on our homepage) and 11 unused Unsplash/Pexels URLs. `grep` the live bundle for `images.unsplash|images.pexels|flowhydration` returns nothing.
- **Hero** is the North Fremont storefront under an opaque cover, matching the Hoang Le tax site's page-hero treatment: a near-solid `rgba(10,26,38,0.78)` field, then two soft radial accents, then a bottom weight. The photograph reads as texture, not as the subject. Dial the 0.78 if it needs to be lighter.
- **Homepage gallery** (the 4-up in the Reviews section, previously `TODO`) is Central Fremont x2, North Fremont x1, Newark x1. Newark's single slot is the tight crop through the purification-room window - no other store has one.
- **Location pages** each gained a storefront card plus a 3-photo gallery from that store, all interiors rather than repeated bottle shelves. `object-position` is set **per page**: the two strip-mall units carry their signage on a fascia band above the windows and need `center 15%`, while the Newark kiosk stays `center 50%` because its roof fills the top of the frame.
- **24-hour self-serve vending** documented everywhere: an "After hours" row on each location info card, a line on the homepage store cards (`STORES[].vending`), `amenityFeature` on each store schema node, and a new FAQ schema entry. Verified on-site from the signage at all three stores - the machines take cash only ($1/$5 bills, quarter, dime, nickel, no pennies).
- **Homepage nav** now switches to the light (dark-text-on-white) treatment once the hero scrolls away, matching the static pages. New `pastHero` state in `Nav`, threshold `window.innerHeight - 72`, with a resize listener; `onLight = dark || pastHero` drives every colour token.
- **Scroll progress bar** ported from the homepage `ScrollProgress` component to all four static pages as inline CSS + a small rAF script. Respects `prefers-reduced-motion` like the React version.
- **Plans section:** heading no longer wraps mid-phrase (`max-w-3xl` + `md:whitespace-nowrap`); in the Balance section the lookup moved left and the plan comparison right using `order` utilities, so the form stays first in the DOM for screen readers.

## Recent updates (Aug 18–24, 2026)

- **SEO overhaul.** `index.html` `<title>` shortened to "Le Water Store | Alkaline & Purified Water Refill". Added JSON-LD `Organization` node (`#org`) with `aggregateRating` 4.1/180 + `foundingDate` 1998, and `parentOrganization` links on the 3 store nodes. **(Superseded 2026-08-25: the `aggregateRating` was removed as self-serving markup, `WaterStore` was an invalid type and is now `Store`, and the title is now brand-first. See the SEO / correctness pass section.)**
- **New static content pages** (real HTML in `public/<slug>/index.html`, self-contained inline CSS, own title/meta/canonical/JSON-LD — served directly, NOT SPA-rendered):
  - `/our-water` — RO + coconut carbon process, alkaline explainer, FAQ (`Article` + `Breadcrumb`).
  - `/fremont-north`, `/fremont-central`, `/newark` — per-store location pages (`Store` + `Breadcrumb`), map embed, hours, cross-links.
- **`vercel.json` added** (`cleanUrls:true, trailingSlash:false`) — REQUIRED so `/our-water` serves the static file instead of the SPA. `public/sitemap.xml` now lists all 5 URLs.
- **Homepage nav** cleaned: dropped "Reviews", added "Our Water" (at the end), both desktop + `MOBILE_LINKS`. **Store cards are click-through** to their location page (`STORES[].slug`, `onClick` guarded against inner links).
- **"Our Story" section** now lives at the TOP of `/our-water` (was briefly on the homepage). Trimmed to just the tagline heading ("Ultra fresh great tasting water. Since 1998.") + one heritage line + "Buy local, support your neighbors" — the process/price/CTA paragraphs were removed because they duplicated the rest of the page. Homepage `<Story/>` component was removed.
- **Real water process everywhere.** Replaced fabricated "six-stage RO + UV sterilization" with the true process (local Alameda County supply → reverse osmosis → **coconut carbon filter** → made fresh daily, **no preservatives**) on `/our-water`, all 3 location pages, and FAQ. Plans heading → "Ultra fresh great tasting water."
- **Balance lookup now shows last 3 transactions** (date · type · ±gallons · resulting balance). New Supabase RPC `public_lookup_transactions` (migration `0042` in the WaterStore repo, applied live; `service_role`-only, same hardening as 0039/0040). `api/balance.js` calls it via `fetchRecent()` (resilient — failure returns `[]`), returns `recent[]`. `App.jsx` Balance renders "Recent activity"; dates pinned to `America/Los_Angeles`.
- **New brand logo INSTALLED.** Replaced the old jug mark with a **water-droplet + wave** logo (Gemini-generated, navy→cyan gradient + gloss). Originals in `public/brand/` (`lewater-logo-drop.jpeg`, `lewater-logo-lockup.jpeg`); the drop was background-keyed (ffmpeg `colorkey`) to a transparent `public/logo-mark.png` (copied to `public/favicon.png`). Wired into the nav, favicon, intro loader, footer, and schema `image` — homepage + all 4 static pages. `JugMark` component still defined but now only used for the small balance-lookup card icon. Old `favicon.svg` no longer referenced (file still present). Source logos also filed in `~/.claude/skills/banana/refs/` (reusable brand-inputs per global CLAUDE.md) and removed from `~/Downloads`.
- **Lockup wordmark.** Nav/loader now use the generated lockup treatment instead of plain Inter "Le Water": **"LE WATER STORE"** in Montserrat 700 uppercase (letter-spacing 0.04em) with a small **"PREMIUM WATER REFILL"** tagline. Montserrat added to the Google Fonts link (homepage + static pages). Static-page wordmark markup = `.brand .wm` / `.wm-name` / `.wm-tag`.
- **Intro loader** updated to the new brand: the water-splash sequence now reveals the drop logo + "LE WATER STORE" (forced `whitespace-nowrap` — the `.loader-stage` is only 300px wide) + "Premium Water Refill". Loader is desktop-only (`@media` hides it on mobile).
- **Nav links centered.** The primary nav links are now absolutely centered in the bar (`absolute left-1/2 -translate-x-1/2` on the links div; parent made `relative`), brand left / CTA right unchanged.
- **`/our-water` cleanup:** removed a leftover false "Tested and UV-treated" hero pill → "Made fresh daily".
- **GBP profiles to be unified to "Le Water Store"** (JarvisEA `decisions/log.md`). Per-store GBP descriptions finalized: flagship (N. Fremont, 35762 Fremont Blvd) = "serving Fremont and Newark since 1998"; **Lion** (Newark, 39131 Cedar Blvd, in Lion Supermarket Plaza) + **FoodMaxx** (Central Fremont, 39409 Fremont Blvd) opened later, so they read "part of the family-run Le Water stores serving Fremont and Newark since 1998". All three use a "Pay with cash or card, or prepay with a membership and save" line. ~~NOTE: site still labels the two later stores "Le Pure Water" / "Lion Pure Water"~~ — **resolved 2026-08-25**, see the Aug 24-25 entry.
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
2. **Gallery** (`#gallery`) + **Reviews** (`#reviews`) — split into two sections on 2026-08-30 so each fits a screen. Formerly one merged section: the "Delivering the best water in Fremont for over 20 years." lead + a 4-image **store gallery** (real on-location photos since 2026-08-25, served full-resolution — see the photography gotcha) + "What our customers say" with a **4.1 / 180+ Google reviews** aggregate header + 1 featured Yelp quote + 3 supporting cards. Quotes are Yelp, the aggregate is Google — see Reviews / ratings.
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

GitHub auto-deploy is **NOT** connected (the Vercel GitHub app lacks access to the `ivince918` repo). Deploys are **CLI-direct** from the repo root. **Vercel runs the build itself**, so the
prerender step runs on their machine — confirm it did:
`npx vercel inspect <deployment-url> --logs | grep -iE "prerender:|Build Completed|error"`.
A build that fails there still prints "Production ready" at the CLI while leaving the
previous deployment live. Also compare `dist/assets/*.js` to the hash on the live page. The `vercel` CLI is **not installed globally** on this machine — invoke via `npx`:

```bash
npx --yes vercel@latest deploy --prod --yes    # from le-water/ ; auto-links project le-water, aliases lewaterstore.com
```

- **"Not authorized" on deploy means a stale link, not a permissions problem.** Hit this on 2026-09-05: `npx vercel --prod` returned `{"status":"error","reason":"deploy_failed","message":"Not authorized"}` while `npx vercel whoami` printed `brianle423` and `npx vercel project ls` showed `le-water` right there under `brianle423s-projects`. The cached OIDC token in `.vercel/` had expired. Re-link and the same command works:

  ```bash
  npx vercel link --yes --project le-water --scope brianle423s-projects
  ```

  It rewrites `.vercel/project.json` with identical ids and drops a fresh `VERCEL_OIDC_TOKEN` into `.env.local` (both gitignored). Do not go hunting for a scope or ownership problem first.
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

**Two different sources. Label them separately — this has been got wrong once already.**

- The four hard-coded quotes in `REVIEWS` (Mango T. featured, Norma D., Rochell S.,
  T J.) are **Yelp** reviews. They render with a "From our Yelp reviews" tag. They were
  briefly mislabelled "From our Google reviews", and before that carried a
  "Verified customer review" badge asserting a verification process that does not
  exist — an FTC 16 CFR 465 exposure. Do not reintroduce either.
- The **4.1 aggregate is Google**, and matches: per-store ratings pulled live from the
  Maps profiles on 2026-08-25 are **North Fremont 4.4, Central Fremont 4.0, Newark 4.0**
  (mean 4.13). The **180+ count** is real (confirmed by Brian) but Google does not
  expose per-store counts publicly — it comes from the GBP dashboards, so re-pull it
  from there rather than trying to scrape it.
- `GOOGLE_PROFILES` in `src/App.jsx` holds the three Maps profile URLs, resolved from
  each store's place id (`cid=`) and verified to load. **Yelp profile URLs are still
  unknown** — that is why the Yelp tag carries no link.
- Any figure on the page must trace to one of these. Never average, estimate, or carry
  a number forward from an older commit.

## Local SEO & structured data

- **`index.html` `<head>`** carries: meta description, Open Graph + Twitter tags, canonical, and a **LocalBusiness JSON-LD `@graph`** with one `Store` node per location (name, full `PostalAddress`, `telephone`, `GeoCoordinates`, `openingHoursSpecification` Mo-Su 10:00-19:00). **Keep the JSON-LD addresses in sync with the NAP list above and with Google Business Profile.**
- **`public/robots.txt`** — allows all, points to the sitemap.
- **`public/sitemap.xml`** — 8 URLs (home, 3 stores, our-water, contact, privacy, accessibility), `lastmod` is hand-set (bump it on meaningful content changes). `public/` is copied to dist root by Vite, so both serve at `/robots.txt` and `/sitemap.xml`.
- **Google Search Console:** domain **verified** — `dig TXT lewaterstore.com` returns the `google-site-verification` record (confirmed 2026-08-25). Still open: confirm the sitemap is submitted and all 8 URLs are indexed.
- **Higher-leverage than the site for "water store near me":** claim/clean all 3 **Google Business Profiles**; NAP must match the schema exactly.

## Analytics

`@vercel/analytics` installed; `<Analytics />` rendered in `src/main.jsx`. Web Analytics is enabled on the Vercel project. Data: Vercel dashboard → `le-water` → Analytics tab.

**Conversion events** (fired via `track()` through the `trackEvent()` wrapper in `App.jsx`, which swallows errors so analytics never throws into the UI):
- `hero_find_store`, `hero_check_balance`, `hero_see_plans` — hero CTAs
- `balance_lookup` `{ result: 'found' | 'not_found' | 'error' }`
- `get_directions` `{ store }`, `call_store` `{ store }` — per store card
- `use_my_location` — the nearest-store geolocation button

## Google Business Profile state (2026-08-25)

The site's names, hours and schema must stay in sync with these.

| Store | GBP | Storefront signage still says |
|---|---|---|
| North Fremont (35762 Fremont Blvd) | live as Le Water Store | WATER |
| Central Fremont (39409 Fremont Blvd) | live as Le Water Store | PureWater |
| Newark (39131 Cedar Blvd) | **pending review** | CALIFORNIA PURE WATER |

- **The Newark listing was submitted as "Le Water Store (formerly Lion Pure Water)".** Google's naming policy allows the real-world name only; parentheticals, descriptors and taglines are named suspension triggers, and there is no supported "formerly" convention. Set it to exactly **Le Water Store** — a rename preserves reviews and listing history, so nothing is protected by hedging. Put "formerly Lion Pure Water" in a Google Post or the description instead.
- **Signage is now the last inconsistency.** All three storefronts show a different name from the listings, and those signs appear in the cover photo of each listing. Google's rule is that the listing name reflects real-world signage, so the mismatch now runs the opposite direction from where it started.
- **Hours differ per store** — Newark 10:00-18:30, both Fremont stores 10:00-19:00. Do not copy one across three. (`STORES[].close` is 18.5 / 19 / 19.)
- Full checklist, including the attributes and reviews work that is still open: `~/PycharmProjects/WaterStore/docs/marketing/gbp-optimization-checklist.md`. Shot list for future photo runs: `gbp-photo-shot-list.md` alongside it.

## SEO / correctness pass (Aug 25-30, 2026)

A full audit ran against the live site and most of it was fixed. Then a large part of
it was **reverted**, because the pass had changed the design without asking. Read the
"Design constraint" gotcha below before touching anything visual.

Commits: `b24a9d9` (pass) → `f212cc7`, `4d5002f`, `60ddd81`, `e072b41` (reverts) →
`cdbe420` (restore), `e8c0642` (titles).

### What shipped and stayed

- **Schema.** `"@type": "WaterStore"` is **not a Schema.org type** — `schema.org/WaterStore`
  404s and it is absent from the vocabulary, so every LocalBusiness node was ineligible
  for rich results. All six now use `Store`. The self-serving `aggregateRating` is gone
  from the Organization node (Google policy: the reviewed entity must not control the
  reviews; Google already surfaces the live GBP rating). The same three stores had been
  declared under six different `@id`s — location-page `@id`s are now canonical and the
  homepage `@graph` references them. Added `WebSite`, Organization `logo`, `areaServed`,
  `sameAs` + `hasMap` (Maps URLs from each place id, verified), `Offer` nodes, and
  `FAQPage` on `/our-water`.
- **Correctness.** The FAQ claimed purified and alkaline cost "the same low per-gallon
  price for members" ($0.375 vs $0.90). The TrustBar claimed "no days off" when Newark
  closes 6:30p. `/our-water` claimed bottled brands "mix in preservatives to control
  algae", which is false under FDA's standard of identity and becomes Lanham Act
  exposure in paid ads. All gone.
- **Titles** (`e8c0642`) — every page now leads with **Le Water Store**. The location
  pages had previously named the brand twice ("… — Le Water Store | Le Water"), which is
  why Google truncated them in the SERP, and three pages used "Le Water" while the GBP
  name is "Le Water Store". All 8 are 30-49 chars; `title` == `og:title` ==
  `twitter:title` on every page.
- **New pages:** `/privacy` (CalOPPA — required because the balance lookup collects
  phone numbers, and a precondition for GA4 / Google Ads remarketing / the Meta Pixel),
  `/contact`, `/accessibility`. Linked from every footer.
- **Perf.** Self-hosted Inter + Montserrat (latin subset, `public/fonts/`), replacing the
  render-blocking `fonts.googleapis.com` link that Lighthouse measured at 834-843ms on
  mobile on every page. `logo-mark.png` and `favicon.png` were 512x512 / ~202KB each
  displayed at 32px — resized, plus a real `apple-touch-icon`, for **367KB off every
  page**. `vercel.json` now sets immutable caching on `/assets`, `/fonts`, `/photos` and
  adds CSP-adjacent security headers.
- **Two real bugs fixed.** Scroll-reveal could leave content at `opacity:0` *permanently*
  if you scrolled past it faster than the IntersectionObserver coalesced — the entire FAQ
  section and two bottle cards were affected. The sweep now reveals anything at or above
  the fold line. And campaign traffic (`gclid`/`fbclid`/`utm_*`) or any external referral
  now skips the 2,850ms intro curtain instead of waiting through it.
- **Accessibility.** Balance input properly labelled, dead logo anchor fixed.
- **`<noscript>` fallback** on the homepage carrying NAP, prices and links, limited to
  facts that cannot go stale — so non-JS AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
  CCBot) get something. They otherwise see `<div id="root"></div>`.

### What was reverted, and why it must not come back casually

- **The hero subheadline and spacing tweaks.** Every section is built to fit one screen.
- **A footer rebuild** carrying the full 3-store NAP: +489px on mobile. Only the
  Contact / Privacy / Accessibility links were kept.
- **`srcset` on the homepage** — see the photography gotcha below.
- **The static hero** (real hero markup inside `#root` so it paints before React). It
  required disabling the hero entrance animation to avoid a flash on handoff, and
  measurement showed it did **not** move LCP anyway — the real fix was the font preload.
- **A 7th FAQ item.** Instead of adding 65px to the page, the FAQPage markup dropped that
  question, so page and schema still match at 6. Parity restored the other direction.

### The font-preload trap (this was the actual LCP bug)

`.display` is **Inter 600** on the homepage and location pages and **Montserrat 600** on
the three text pages, but every page was preloading Inter 400 and Montserrat 700. The H1
painted in the fallback face and reflowed when the real font arrived, registering a
*second* LCP candidate ~2.2s late. Fixing the preload collapsed two LCP candidates into
one at first paint. **If you change a heading font or weight, change the matching
`<link rel="preload">`.**

### Still not done, deliberately

Full SSG / pre-rendering of the homepage. It would bake time-dependent "Open now" state
into crawlable HTML — a new accuracy bug of exactly the kind this pass removed. The
`<noscript>` block is the safe partial. Revisit only with the live-status components
gated behind a `mounted` flag.

### Audit artifacts

`lewaterstore.com-audit/` (gitignored): `FULL-AUDIT-REPORT.md`, `ACTION-PLAN.md`,
`audit-data.json`, 9 per-specialist findings files, ~40 screenshots, and a generated PDF.

## Search performance & competitors (baseline, Aug 27 2026)

First real GSC data, 7 days. **Keep this as the before-picture** — the prerender, legacy
names and brand-first titles all shipped after it.

- **16 clicks, 671 impressions, 2.4% CTR, average position 3.2.**
- Position 3.2 on a three-week-old site is a good result, not a bad one. The problem is
  CTR: position 3 normally earns 10-15%.
- **14 of the top 20 queries got zero clicks** — 368 wasted impressions.
- **"water" alone: 144 impressions, 0 clicks.** Junk volume; nobody typing "water" wants a
  Fremont refill store. Mentally subtract it before judging CTR.
- Nine query themes had **no on-site coverage at all**: `le pure water` (40/wk),
  `water dispenser` (38), `fremont water` (27), `water refill station near me` (11),
  `water store fremont` (10), `water station near me` (9), `water filling near me` (8),
  `water gallon` (8), `water jar` (7). The `/contact` rewrite covers most of these now.

### Do not chase Water Emporium on reviews — that fight is already won

| | rating | reviews |
|---|---|---|
| Le Central Fremont | 4.0 | **102** |
| Le North Fremont | 4.5 | **75** |
| Le Newark (still "Lion Pure Water") | 4.0 | **21** |
| **Le total** | | **198** |
| Water Emporium, Fremont | 4.6 | 43 |
| Vel Pure Water | 4.7 | 11 |

**Newark (21) is the only genuine review gap**, against neighbours at 61 and 69.

### Why competitors outrank us — two unrelated causes

- **Map pack is mostly proximity.** From Fremont Civic Center: Le #1, Le #2, Water
  Emporium #3. From Warm Springs: **Vel Pure Water ranks #1 with 11 reviews**, ahead of
  Le's 102. An 11-review store beating a 102-review store is distance, nothing else.
  Water Emporium owns east Fremont because we have no store there. Not an SEO problem.
- **But Water Emporium holds #2 across Fremont for a second reason: "Fremont" is inside
  its GBP name** ("Water Emporium, Fremont"). Exact keyword match in the business name is
  a strong local-pack signal and it works from any origin. The query splits — we match
  "water store" (our name), they match "Fremont" — and their **4.6 vs our 4.0** on
  Central Fremont breaks the tie.
  **Do not copy this.** Adding a city to a GBP name is the same naming-policy violation
  holding up the Newark rename. If it is keyword stuffing, report it via Suggest an edit.
- **Categories are not a differentiator.** All five businesses are "Bottled water
  supplier". (An earlier check that reported "Water Store" for Le was a false positive —
  the regex matched the business *name*, which contains "Water Store".)
- **Organic** was the homepage prerender bug, now fixed. Vel Pure Water is a worse site —
  no H1, no schema, lorem-ipsum pages — but shipped 485 crawlable words while `/` shipped
  0, which is why Google composed their snippet with the street address.

### NAP fragmentation — the highest-leverage work left, and it is not on the site

Confirmed live, not hypothesised:

| platform | North Fremont | Central Fremont | Newark |
|---|---|---|---|
| Google | Le Water Store | Le Water Store | **Lion Pure Water** (rename pending) |
| Yelp | **The Water Spot** — unclaimed, 4.6/19 | Le Water Store — claimed, 3.3/8 | **Pure Water** — unclaimed, 4.6/12 |
| Nextdoor | Water Spot | Le Pure Water | **3-way duplicate**: Lion Pure Water / Pure Water / California Pure Water |
| YellowPages | Le Water Store | Le Pure Water | Lion Pure Water |
| MapQuest / Yahoo | The Water Spot | — | — |

- **Yelp's "BEST 10 WATER STORES IN FREMONT" ranks "The Water Spot" #1** — above Water
  Emporium, above our own "Le Water Store" at #3. **We outrank ourselves under a dead
  brand.** Both unclaimed Yelp listings hold better profiles (4.6/19, 4.6/12) than the
  claimed one (3.3/8), and claiming + renaming them is free.
- Phone numbers are correct on every listing found — the strongest reconciliation key.
- **Google itself is clean**: no duplicates at any of the three addresses. Only defect is
  the Newark name.
- Not checked: Apple Maps, Foursquare, Manta, BBB, Cylex, Chamberofcommerce. Four of six
  platforms that were checked carry a legacy name, so assume these do too. A paid citation
  scan (BrightLocal / Whitespark / Yext) would close this faster than scraping — Yelp hard-
  blocks WebFetch and headless Chromium alike.

Full detail: `lewaterstore.com-audit/findings/competitor-water-emporium.md` (gitignored).

## Open items / TODO

1. **REAL PHOTOS — done for the hero, gallery and location pages (2026-08-25).** Still stock-free but thin in two places: the **Bottles product cards** (`PRODUCTS`) have no photos yet, and three shots are missing from every store — **water actually dispensing from a tap**, a **dusk exterior with the sign lit**, and (North Fremont only) any third distinct interior. North Fremont has just 6 usable photos, 3 of them exteriors, so its gallery pairs a wide counter with a taps close-up of the same counter.
2. **New-customer offer CTA (still open).** The Lion acquisition promo ($50 / 150 gal + free jug) is NOT on the site. It's the main acquisition lever for a local store; recommend a hero banner or dedicated strip.
3. **GBP / Yelp / citations — downgraded 2026-09-07, and partly done.**
   Search Console shows the legacy names already rank to this site ("the water spot" 1.0,
   "le pure water" 1.9), so this is a **data-accuracy** problem, not the ranking blocker the
   Aug notes assumed.
   - **(a) Yelp profiles: claimed, renames requested by Brian 2026-09-06.** Pending re-index.
     **The rename does NOT touch the pricing or hours fields.** The Le Pure Water listing
     still states **25c/20c per gallon against a real $0.50/$0.375**, and a listing shows
     **10am-8pm against a real 10am-7pm**. Those are separate attributes and must be edited
     directly. That, not the name, is what a customer or an AI actually quotes.
   - (b) finish the **Newark GBP rename** off "Lion Pure Water";
   - (c) merge the **three duplicate Nextdoor Newark listings**;
   - (d) lift **Central Fremont from 4.0** — competing head-on with Water Emporium's 4.6;
   - (e) **Newark review velocity** (21 vs 61 and 69).
   - (f) A possible **fourth** legacy name, "California Pure Water", surfaced in a YellowPages
     URL slug and reportedly matches the physical storefront sign. **Unconfirmed — verify with
     the owners before it goes anywhere near schema.** A wrong `alternateName` worsens exactly
     the entity confusion this work is meant to fix.
   - Also wrong on the Lion Supermarket plaza directory: **street number 39055, real is 39131**.
   Sitemap is submitted. The **Indexing API is now authorized**, so re-indexing can be
   requested programmatically rather than through the console.
4. ~~**No social OG image**~~ — **resolved.** `og.png` is live at exactly 1200x630 (29KB) with `og:image:width`/`height`/`alt` and `twitter:card summary_large_image` on every page. Link previews work.
5. **GitHub auto-deploy still not connected — and it fails silently.** Confirmed 2026-08-25: `git push origin main` succeeds and `origin/main` matches local HEAD, but Vercel creates **no deployment at all** (verified via the deployments API — zero entries after the push). A push therefore *looks* shipped and is not. Until the Vercel GitHub app is granted access to `ivince918/le-water`, every change needs a manual CLI deploy.
   **The first `npx vercel@latest deploy --prod --yes` of a session often returns an error object; a straight retry succeeds.** Seen Aug 25-30, but *not* on either deploy of Aug 30 pm — both went through on the first call. Treat it as a known flake, not a rule.
   **Confirmed again 2026-09-07, and the error message is actively misleading.** The CLI
   printed `"message": "Not authorized"`, which reads like a permissions problem and sent one
   session down a long wrong path (checking `whoami`, `teams ls`, concluding the project lived
   under a different team — it does not; `le-water` is in `brianle423s-projects` and always
   has been). `--debug` showed the real response: `{"error":{"code":"missing_files"}}`, which is
   normal upload negotiation. **Do not diagnose the account on "Not authorized". Just retry,
   and use `--debug` before believing any auth-shaped error from this CLI.** Always confirm afterwards by comparing the live asset hash to `dist/assets/*.js` and grepping the build log for `prerender:` + `Build Completed`.

   **Root cause found 2026-08-30, and the old instructions above were wrong — Brian cannot do this himself.** Verified:
   - `ivince918` is a **personal User account**, not an org (`gh api /repos/ivince918/le-water --jq .owner.type`).
   - Brian's GitHub `brianle423` has `push: true, admin: false` on the repo.
   - The Vercel project lives in **Brian's** team (`brianle423s-projects`) with no Git repo attached.
   - `npx vercel@latest git connect --yes` fails: *"Failed to connect ivince918/le-water to project."* That is the permission wall, not a typo.
   - Connecting requires **admin** on the repo. On a personal-account repo, collaborators only ever get write. **There is no admin role to grant Brian while the repo lives under `ivince918`.** No amount of clicking in Vercel or GitHub settings fixes this.

   Three ways out: (a) Vincent transfers the repo to `brianle423` (Settings → General → Danger Zone → Transfer; keeps history and redirects), then Brian installs github.com/apps/vercel on `le-water` and runs `vercel git connect --yes`; (b) move it to a shared org with both as owners — better for a family-business asset; (c) leave it and keep deploying by CLI. Verify with `git commit --allow-empty && git push` then `npx vercel@latest ls le-water` — a deployment must appear within ~30s. **The failure is silent, so this check is not optional.**
6. Loader intro `translateY(-60px)` (`.loader-stage` in index.css) is an eyeball-centered value; nudge if needed.
7. **Bottle prices are still "Ask at the counter".** `water dispenser` (38/wk), `water gallon`
   and `water jar` all draw impressions with nothing to land on. Publishing prices would also
   unlock `Product`/`Offer` schema — do not add that schema before the prices are on the page,
   or it becomes a parity violation.
8. **Yelp `sameAs`** — add the three profile URLs to the Store nodes once the listings are
   claimed. Yelp 403s this machine so the slugs could not be verified from here.
9. **Sections that still exceed a screen** at 1497x745: balance 848, faq 848, plans 991,
   stores 1041. Stores is deliberate (see the height budget). The others are untouched.

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

- **`md5` the fonts before trusting the font setup.** The self-hosted set shipped as 7 files
  that were only **2 unique** — the same Inter variable font under `inter-400/500/600/700.woff2`
  and the same Montserrat under three names. Identical byte sizes across weights (48432 x4,
  35508 x3) is the tell. It rendered correctly, so nothing looked wrong; it just cost 220KB
  per cold load. Fixed 2026-09-07 by collapsing to 2 `@font-face` rules with weight ranges.
  **If anyone re-adds per-weight files, check they are actually different files first.**
- **`@font-face` blocks are inlined in all 8 HTML files, not shared.** `public/fonts/fonts.css`
  exists but **nothing references it** — it is dead. Edit the inline `<style>` in each page, and
  grep before assuming you got them all (same trap as the `og:title` note above).
- **The build prerenders `/`, so `src/App.jsx` runs in Node.** No unguarded `window` or
  `document` in a render path — `useHashRoute`'s lazy `useState(() => window.location.hash)`
  crashed the build until it was guarded. `useEffect` bodies are safe. If `npm run build`
  dies in `dist-ssr/entry-server.js`, this is why.
- **Screenshot section seams, not sections.** A layout change that looked correct in seven
  isolated per-section screenshots shipped a visibly broken background rhythm, because the
  defect lived at the boundaries. Capture the joins, or a full-page strip, before deploying
  anything that changes section height, padding or order.
- **Confirm deploys from the Vercel build log, not the CLI.** A failed build still prints
  "Production ready" while leaving the old deployment live — that happened once already,
  when the prerender launched Chrome from a macOS path on their Linux builders.
  `npx vercel inspect <url> --logs | grep -iE "prerender:|Build Completed|error"`.
- **Design constraint: every section is built to fit one screen.** The hero is minimal
  for that reason — no subheadline, specific padding. Brian notices vertical additions
  immediately. **Separate correctness work from design work: ship the invisible fixes,
  and propose anything that touches copy, spacing or layout before doing it.** An SEO
  pass that quietly added a hero subheadline, changed `mt-9` to `mt-8` and rebuilt the
  footer cost several rounds of reverts. When a fix has a design cost, name the cost and
  offer the option.
- **Verify visual changes by pixel diff, not by section height.** Build the previous
  commit in a `git worktree`, serve both, screenshot full-page at the same viewport with
  `reduced_motion="reduce"` (kills ken-burns and entrance animations), and diff. Equal
  section heights proved nothing when the gallery photos had silently gone soft.
- **Photography stays full-resolution — do not add `srcset` to the homepage.** It was
  tried with `sizes="(min-width: 768px) 25vw, 100vw"`, which resolves to 374px at a
  1497px viewport. The gallery slots actually render at **612px and 298px**, so the
  browser correctly picked the 480w variant and upscaled it — visibly soft photos in the
  customers section. If responsive images are ever revisited, **measure every slot with
  `getBoundingClientRect().width` first** and assert `naturalWidth >= rendered` on the
  live page afterwards. Never derive `sizes` by reading the CSS. Width variants still
  exist in `public/photos/` and are used on the location pages, where `sizes` is correct.
- **Verify against the live domain**, not the alias: `curl --resolve lewaterstore.com:443:216.198.79.1 https://lewaterstore.com/...`. The `le-water.vercel.app` alias caches briefly after deploy.
- **Minification false-negatives:** grepping the prod JS bundle for JSX text/attrs (e.g. `id="bottles"`) often returns 0 because minification splits/transforms them. Worse, anything built at runtime never appears literally — a `srcset` assembled from a template string will not grep as `-480.webp`. **Check rendered DOM in a browser, not the bundle.**
- **npm build does NOT catch every runtime issue** — for anything touching the serverless function, smoke-test `/api/balance` on the deployed URL after deploy.
- **The unused `IMG` keys are gone** (removed 2026-08-25). `IMG` is now 5 keys, all local `/photos/` paths.
- **Photo near-duplicates are the recurring trap on this site.** `05-purification-room` in the Lion set *is* `04-fill-station` with the viewing window in frame — same counter, same blue wall. It shipped as a duplicate pair twice (homepage, then the Newark page) because the filenames read as different subjects. **Verify a gallery by rendering its images side by side, never by filename.** The fix both times was the tight `purification-window` crop.
- `object-position` on `.shotcard img` is **per location page**, not a shared rule — see the Recent updates entry. If you swap a storefront photo, re-check the crop.

## Related

- POS system + DB source of truth: `~/PycharmProjects/WaterStore/` (see its `README.md` and `docs/superpowers/handoffs/`).
- `DEPLOY.md` (this repo) — the original deploy runbook.
