/**
 * Build-time prerender for the homepage.
 *
 * Why: every page on this site ships real HTML except `/`, which served
 * `<div id="root"></div>` and nothing else. That is the priority-1.0 URL, so
 * non-rendering crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot) and Google's
 * pre-render pass saw zero words, zero images and no NAP.
 *
 * How: render the built site in headless Chrome, snapshot `#root`, and inject it
 * back into dist/index.html.
 *
 * Two invariants keep this visually inert:
 *   1. Time-dependent text is neutralised. Store "Open now" / "Closed" pills are
 *      computed from the clock, so baking them would put a stale claim into
 *      crawlable HTML. They are replaced with "Open daily", true for all three.
 *   2. Reveal classes are left exactly as React first renders them (no `is-in`),
 *      so the snapshot matches React's initial DOM. main.jsx uses createRoot,
 *      which clears the container on mount — the user always sees the live app.
 */
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const DIST = resolve('dist')
const PORT = 4321
const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain', '.json':'application/json' }

const server = createServer(async (req, res) => {
  try {
    let p = join(DIST, decodeURIComponent(req.url.split('?')[0]))
    if ((await stat(p).catch(() => null))?.isDirectory()) p = join(p, 'index.html')
    if (!extname(p)) p = p + '/index.html'
    const buf = await readFile(p)
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
    res.end(buf)
  } catch { res.writeHead(404); res.end('nope') }
})

await new Promise(r => server.listen(PORT, '127.0.0.1', r))

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// utm_source short-circuits introEligible(), so the loader curtain never mounts.
await page.goto(`http://127.0.0.1:${PORT}/?utm_source=prerender`, { waitUntil: 'networkidle' })
await page.waitForSelector('#root section', { timeout: 20000 })
await page.waitForTimeout(1200)

// The clock-derived status pills must not be frozen into the HTML.
const LIVE_STATUS = /^(Open now|Opens 10 AM|Closed · opens 10 AM|Open · closes [\d:]+ (AM|PM))$/
const neutralised = await page.evaluate((src) => {
  // The status sits as a bare text node beside a dot <span>, so walk text nodes
  // rather than elements — an element-level check skips it.
  const re = new RegExp(src)
  const walker = document.createTreeWalker(document.getElementById('root'), NodeFilter.SHOW_TEXT)
  const hits = []
  while (walker.nextNode()) {
    if (re.test((walker.currentNode.nodeValue || '').trim())) hits.push(walker.currentNode)
  }
  hits.forEach(n => { n.nodeValue = 'Open daily' })
  return hits.length
}, LIVE_STATUS.source)

const html = await page.evaluate(() => document.getElementById('root').innerHTML)
await browser.close()
server.close()

const file = join(DIST, 'index.html')
const shell = await readFile(file, 'utf8')
if (!shell.includes('<div id="root"></div>')) {
  console.error('prerender: could not find an empty #root in dist/index.html — aborting')
  process.exit(1)
}
await writeFile(file, shell.replace('<div id="root"></div>', `<div id="root">${html}</div>`))

const words = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length
const imgs = (html.match(/<img\b/g) || []).length
console.log(`prerender: ${(html.length/1024).toFixed(0)}KB into #root — ${words} words, ${imgs} images, ${neutralised} live-status nodes neutralised`)
