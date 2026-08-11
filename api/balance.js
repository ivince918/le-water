// Vercel serverless function: public balance lookup for the Le Water site.
//
// Why a server function instead of calling Supabase from the browser:
//   * The Supabase service role key stays server-side and never ships to the client.
//   * public_lookup_balance is granted to service_role ONLY (migration 0039), so
//     the public anon key cannot reach customer data directly.
//   * We can rate-limit by IP here to slow phone-number enumeration.
//
// Response is deliberately minimal: store name, plan, remaining gallons. No name,
// no id, no history. See supabase/migrations/0039_public_balance_lookup.sql.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Best-effort in-memory rate limit. Serverless instances are ephemeral and not
// shared, so this throttles a single warm instance, not the whole fleet. Good
// enough to blunt casual scraping for V1; move to Upstash/Redis if abuse shows up.
const WINDOW_MS = 60_000;
const MAX_HITS = 12;
const hits = new Map(); // ip -> number[] (timestamps)

function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return recent.length > MAX_HITS;
}

const PLAN_LABEL = { 0: 'Regular', 1: 'Alkaline' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Lookup is not configured yet.' });
  }

  // Vercel provides the real client IP in x-forwarded-for.
  const now = Date.now();
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip, now)) {
    return res.status(429).json({ error: 'Too many lookups. Please wait a minute and try again.' });
  }

  const raw = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const digits = String(raw.phone || '').replace(/\D/g, '');
  if (digits.length !== 10) {
    return res.status(400).json({ error: 'Enter a 10-digit phone number.' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_lookup_balance`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_phone: digits }),
    });

    if (!r.ok) {
      return res.status(502).json({ error: 'Lookup failed. Please try again.' });
    }

    const rows = await r.json(); // [{ store_name, plan_type, gallons }]
    const accounts = (Array.isArray(rows) ? rows : []).map((row) => ({
      store: row.store_name,
      plan: PLAN_LABEL[row.plan_type] ?? 'Plan',
      gallons: Number(row.gallons),
    }));

    return res.status(200).json({ found: accounts.length > 0, accounts });
  } catch (err) {
    return res.status(502).json({ error: 'Lookup failed. Please try again.' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}