/**
 * Build-time prerender for the homepage.
 *
 * Why: `/` was the only page on the site serving `<div id="root"></div>` and
 * nothing else — 0 crawlable words, 0 images, no NAP — while every other page
 * ships real HTML. It is also the priority-1.0 URL.
 *
 * How: render the same <App /> through react-dom/server and inject the markup
 * into dist/index.html. No headless browser, so this runs on any CI — an
 * earlier Chrome-based version failed on Vercel's Linux builders.
 *
 * Two invariants keep it visually inert:
 *   1. Store status is computed from the clock ("Open now", "Opens 10 AM",
 *      "Closed · opens 10 AM"). Baking that would put a stale claim into
 *      crawlable HTML, so those nodes are rewritten to "Open daily" — true for
 *      all three stores and time-invariant.
 *   2. Reveal classes are left as React first renders them, so the snapshot
 *      matches React's initial DOM. main.jsx uses createRoot, which clears the
 *      container on mount, so a visitor always gets the live app.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { render } = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')).href)

let html = render()

// Never bake clock-derived state into crawlable HTML.
const LIVE_STATUS = /(Open now|Opens 10 AM|Closed · opens 10 AM|Open · closes \d{1,2}(?::\d{2})? (?:AM|PM))/g
const neutralised = (html.match(LIVE_STATUS) || []).length
html = html.replace(LIVE_STATUS, 'Open daily')

const file = resolve('dist/index.html')
const shell = await readFile(file, 'utf8')
if (!shell.includes('<div id="root"></div>')) {
  console.error('prerender: no empty #root in dist/index.html — aborting so nothing is silently skipped')
  process.exit(1)
}
await writeFile(file, shell.replace('<div id="root"></div>', `<div id="root">${html}</div>`))

const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const need = ['35762 Fremont Blvd', '39409 Fremont Blvd', '39131 Cedar Blvd',
              '(510) 742-5699', '(510) 656-1533', '(510) 739-6225']
const missing = need.filter(n => !text.includes(n))
if (missing.length) {
  console.error('prerender: NAP missing from output —', missing.join(', '))
  process.exit(1)
}
console.log(`prerender: ${(html.length/1024).toFixed(0)}KB — ${text.split(' ').length} words, ` +
            `${(html.match(/<img\b/g)||[]).length} images, ${neutralised} live-status nodes neutralised, NAP complete`)
