# Le Water — Deploy Runbook

Static Vite/React site + one Vercel serverless function (`/api/balance`) that
powers the public balance lookup. Same Supabase project as the POS.

## 1. Apply the DB migration (once)

The lookup needs `public_lookup_balance` in Supabase. The migration lives in the
POS repo (that repo is the DB source of truth):

    WaterStore/supabase/migrations/0039_public_balance_lookup.sql

Apply it to the live project the same way as every other migration:

    cd WaterStore
    supabase db push --db-url "$SUPABASE_DB_URL"
    # or, direct:  psql "$SUPABASE_DB_URL" -f supabase/migrations/0039_public_balance_lookup.sql

It is additive and reversible:

    DROP FUNCTION IF EXISTS public_lookup_balance(TEXT);

## 2. Create the Vercel project

Import `ivince918/le-water` into Vercel (dashboard → Add New → Project) OR:

    npx vercel link
    npx vercel --prod

Framework preset: **Vite** (auto-detected). Build: `npm run build`, output: `dist`.
The `api/` directory is deployed as a serverless function automatically.

## 3. Set environment variables (Production + Preview)

Vercel → Project → Settings → Environment Variables. Server-side only, so **no**
`VITE_` prefix (never shipped to the browser):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | the Supabase project URL (same as POS) |
| `SUPABASE_SERVICE_ROLE_KEY` | the Supabase **service role** key |

Both are in `WaterStore/web/.env.local`. Redeploy after setting them.

## 4. Attach the domain

Vercel → Project → Settings → Domains → add the domain, then point the
registrar's DNS at Vercel (A/ALIAS or the `CNAME` Vercel shows). SSL is automatic.

## 5. Smoke test (before trusting it)

- Load the site, jump to the **Balance** section.
- Enter a real Lion member's phone → shows their remaining gallons.
- Enter a random 10-digit number → "No plan on that number."
- Enter <10 digits → button stays disabled.
- Hammer it ~15x in a minute → 429 rate-limit message.

## Security notes

- `public_lookup_balance` is granted to `service_role` ONLY. The public anon key
  cannot reach customer data. The browser never sees a Supabase key.
- Response is minimal: store name, plan, gallons. No customer name, id, phone
  echo, or history.
- `/api/balance` rate-limits by IP (best-effort, in-memory). If scraping shows
  up, move the limiter to Upstash/Redis.