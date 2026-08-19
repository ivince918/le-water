import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from '@vercel/analytics'
import { Droplet, MapPin, Phone, ArrowRight, Check, Star, Navigation, Clock, Menu, X } from 'lucide-react'

/* Conversion events — never let analytics throw into the UI */
const trackEvent = (name, props) => {
  try { track(name, props) } catch { /* analytics is best-effort */ }
}

/* Stores open 10a daily. Close is 7p everywhere EXCEPT Lion (Newark), which closes 6:30p.
   Per-store close hour lives on STORES[].close (decimal hours); helpers below format it. */
const OPEN_HOUR = 10
const CLOSE_HOUR = 19
const fmtHour = (h) => { // 19 -> "7 PM", 18.5 -> "6:30 PM"
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  const period = hr >= 12 ? 'PM' : 'AM'
  const h12 = ((hr + 11) % 12) + 1
  return min ? `${h12}:${String(min).padStart(2, '0')} ${period}` : `${h12} ${period}`
}
const fmtHourShort = (h) => { // 19 -> "7p", 18.5 -> "6:30p"
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  const period = hr >= 12 ? 'p' : 'a'
  const h12 = ((hr + 11) % 12) + 1
  return min ? `${h12}:${String(min).padStart(2, '0')}${period}` : `${h12}${period}`
}
/* Store status must reflect PACIFIC store time, not the visitor's device clock — otherwise a
   customer on a trip (or with a wrong clock) sees a false "Open now". */
const pacificHour = (now) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(now)
  const hh = Number(parts.find((p) => p.type === 'hour').value) % 24
  const mm = Number(parts.find((p) => p.type === 'minute').value)
  return hh + mm / 60
}
const openStatus = (now = new Date(), closeHour = CLOSE_HOUR) => {
  const h = pacificHour(now)
  if (h >= OPEN_HOUR && h < closeHour) {
    const closesSoon = h >= closeHour - 1
    return { open: true, label: closesSoon ? `Open · closes ${fmtHour(closeHour)}` : 'Open now', closesSoon }
  }
  return { open: false, label: h < OPEN_HOUR ? 'Opens 10 AM' : 'Closed · opens 10 AM' }
}

/* Great-circle distance in miles, for "nearest store" sorting */
const milesBetween = (a, b) => {
  const R = 3958.8
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ─────────── GLOBAL SCROLL REVEAL — fade-up everything tagged .reveal ─────────── */
function useScrollReveal() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

    const scan = () => {
      document.querySelectorAll('.reveal:not(.is-in), .reveal-words:not(.is-in)').forEach(el => io.observe(el))
    }
    scan()
    // Re-scan when new content mounts (Balance form swap, route change, etc.)
    const mo = new MutationObserver(() => scan())
    mo.observe(document.body, { childList: true, subtree: true })

    // Safety net for environments where IO is flaky: rAF-throttled position check
    let ticking = false
    const sweep = () => {
      ticking = false
      const vh = window.innerHeight
      document.querySelectorAll('.reveal:not(.is-in), .reveal-words:not(.is-in)').forEach(el => {
        const top = el.getBoundingClientRect().top
        if (top < vh * 0.92 && top > -el.offsetHeight) {
          el.classList.add('is-in')
          io.unobserve(el)
        }
      })
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(sweep) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}

/* ─────────── BRAND MARK — the Le Water jug, drawn geometric ─────────── */
function JugMark({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {/* cap */}
      <rect x="9.4" y="2" width="5.2" height="2.7" rx="0.9" />
      {/* shoulder */}
      <path d="M10 5.4h4l2 2.8H8l2-2.8Z" />
      {/* body with handle cutout and waterline */}
      <path
        fillRule="evenodd"
        d="M7.4 9c-.8 0-1.4.6-1.4 1.4v7.4A4.2 4.2 0 0 0 10.2 22h3.6a4.2 4.2 0 0 0 4.2-4.2v-7.4c0-.8-.6-1.4-1.4-1.4H7.4Zm7.3 2.6c0-.5.4-.9.9-.9s.9.4.9.9v3.6c0 .5-.4.9-.9.9s-.9-.4-.9-.9v-3.6Zm-6.5 4.6c.6.5 1.3.5 1.9 0 .7-.6 1.7-.6 2.4 0 .3.3.8.3 1.1 0l.2-.2v1.6c0 .3-.1.5-.3.6-.7.4-1.6.3-2.2-.2-.3-.3-.8-.3-1.1 0-.5.4-1.2.6-1.8.4-.1 0-.2-.2-.2-.3v-1.9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/* ─────────── INTRO LOADER — impact splash, letter rise, double-curtain reveal ─────────── */
function Loader() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const splashes = [
    { '--sx': '-36px', '--sy': '-48px' },
    { '--sx': '-16px', '--sy': '-66px' },
    { '--sx': '18px',  '--sy': '-60px' },
    { '--sx': '38px',  '--sy': '-44px' },
  ]

  return (
    <div className="loader" aria-hidden>
      <div className="loader-accent" />
      <div className="loader-curtain">
        <div className="loader-stage">
          <span className="loader-drop2" />
          <span className="loader-flash" />
          {splashes.map((s, i) => (
            <span key={i} className="loader-splash" style={s} />
          ))}
          <span className="loader-ring" style={{ animationDelay: '0.6s' }} />
          <span className="loader-ring" style={{ animationDelay: '0.78s' }} />
          <span className="loader-ring" style={{ animationDelay: '0.96s' }} />

          <div className="absolute top-[148px] inset-x-0 text-center">
            <div className="loader-mark inline-flex">
              <JugMark className="w-9 h-9 text-[#5BC8E6]" />
            </div>
            <div className="display text-white text-[38px] leading-none tracking-[-0.03em] mt-3">
              {'LE WATER'.split('').map((ch, i) =>
                ch === ' '
                  ? <span key={i} className="inline-block w-3" />
                  : <span key={i} className="loader-letter" style={{ animationDelay: `${0.72 + i * 0.045}s` }}>{ch}</span>
              )}
            </div>
            <div className="loader-brand mt-3 text-[10px] tracking-[0.3em] uppercase text-white/45">
              Pure alkaline water
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────── HASH ROUTER — '#bottles' renders the shop page ─────────── */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const fn = () => setHash(window.location.hash)
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  return hash
}

/* ─────────── HEADLINE REVEAL — one clean fade-up, no per-word stagger ─────────── */
function WordReveal({ text, as: Tag = 'span', className = '' }) {
  return <Tag className={`reveal ${className}`}>{text}</Tag>
}

/* ─────────── SCROLL PROGRESS — water level rising at the top ─────────── */
function ScrollProgress() {
  const fillRef = useRef(null)
  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${pct})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none h-[3px]">
      <div
        ref={fillRef}
        className="h-full w-full origin-left"
        style={{
          background: 'linear-gradient(90deg, #5BC8E6 0%, #1E588A 100%)',
          transform: 'scaleX(0)',
          willChange: 'transform',
        }}
      />
    </div>
  )
}

const EASE = [0.23, 1, 0.32, 1]

const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

/* Stock photography seeds tuned for water / refill / store aesthetic */
const IMG = {
  heroSubject:'https://images.pexels.com/photos/40784/drops-of-water-water-nature-liquid-40784.jpeg?auto=compress&cs=tinysrgb&w=2400',  // droplet hitting water with concentric ripples — high res
  introBottle:'https://flowhydration.com/cdn/shop/files/74f0c586-6d0b-43de-8a86-5cf6f5b8383e.jpg?height=921&v=1747146885',      // Flow hydration bottle
  heroBg:     'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=2200&q=80',
  heroPour:   'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1400&q=80',
  bottleClose:'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80',
  refillJug:  'https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=900&q=80',
  storeShelf: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=900&q=80',
  splash:     'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
  glass:      'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=400&q=80',
  jug:        'https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=400&q=80',
  customer:   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  customer2:  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=120&q=80',
  customer3:  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
}

/* ────────────────────────────────── NAV ────────────────────────────────── */
function Nav({ dark = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const MOBILE_LINKS = [
    ['#balance', 'Check balance'],
    ['#stores', 'Stores'],
    ['#plans', 'Plans'],
    ['#bottles', 'Bottles'],
    ['#faq', 'FAQ'],
    ['/our-water', 'Our Water'],
  ]

  const txt = dark ? 'text-[#0A1220]' : 'text-white'
  const sub = dark ? 'text-[#0A1220]/70' : 'text-white/85'
  const chip = dark
    ? 'bg-[#0A1220] text-white'
    : 'bg-white/15 backdrop-blur-md border border-white/25 text-white'
  const cta = dark
    ? 'text-[#0A1220] border-[#0A1220]/15 bg-white/60 hover:bg-white'
    : 'text-white border-white/30 bg-white/10 hover:bg-white/20'
  const bar = scrolled
    ? (dark
        ? 'bg-white/85 backdrop-blur-md shadow-[0_1px_0_rgba(10,18,32,0.06)]'
        : 'bg-[#0a1a26]/65 backdrop-blur-md')
    : 'bg-transparent'

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${bar}`}>
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-5 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <span className={`relative inline-flex w-9 h-9 items-center justify-center rounded-full ${chip}`}>
            <JugMark className="w-5 h-5" />
          </span>
          <span className={`font-bold tracking-tight text-[19px] ${txt}`}>Le Water</span>
        </a>
        <div className={`hidden md:flex items-center gap-9 text-[13.5px] ${sub}`}>
          <a href="#balance" className="link-u">Balance</a>
          <a href="#stores" className="link-u">Stores</a>
          <a href="#plans" className="link-u">Plans</a>
          <a href="/our-water" className="link-u">Our Water</a>
        </div>
        <a href="#stores" className={`hidden md:inline-flex items-center text-[13px] px-4 py-2.5 rounded-full border backdrop-blur-md transition ${cta}`}>
          Find a store
        </a>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className={`md:hidden inline-flex w-10 h-10 items-center justify-center rounded-full border ${dark ? 'border-[#0A1220]/15 text-[#0A1220]' : 'border-white/30 text-white'} backdrop-blur-md`}
        >
          {menuOpen ? <X className="w-5 h-5" strokeWidth={2.2} /> : <Menu className="w-5 h-5" strokeWidth={2.2} />}
        </button>
      </div>

      {/* Mobile menu — the section links + a primary CTA, since the desktop bar hides them below md */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a1a26]/95 backdrop-blur-md">
          <div className="px-6 py-4 flex flex-col text-[15px]">
            {MOBILE_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="py-2.5 text-white/90">
                {label}
              </a>
            ))}
            <a
              href="#stores"
              onClick={() => setMenuOpen(false)}
              className="mt-3 inline-flex items-center justify-center px-5 py-3 rounded-full bg-white text-[#0a1a26] font-medium"
            >
              Find your nearest store
              <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.2} />
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ────────────────────────────────── HERO ────────────────────────────────── */
function Hero() {
  const imgRef = useRef(null)
  const contentRef = useRef(null)
  const sectionRef = useRef(null)
  const mouseRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 })

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf
    const tick = () => {
      const y = window.scrollY
      const vh = window.innerHeight
      const m = mouseRef.current
      // ease cursor drift toward target
      m.x += (m.tx - m.x) * 0.05
      m.y += (m.ty - m.y) * 0.05
      if (y < vh * 1.2) {
        if (imgRef.current) {
          imgRef.current.style.transform =
            `translate3d(${m.x * 18}px, ${y * 0.35 + m.y * 12}px, 0) scale(${1.06 + Math.min(y / 1800, 0.08)})`
        }
        if (contentRef.current) {
          const fade = Math.max(0, 1 - y / (vh * 0.65))
          contentRef.current.style.transform = `translate3d(0, ${y * -0.18}px, 0)`
          contentRef.current.style.opacity = fade
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onMouseMove = (e) => {
    mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5)
    mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5)
  }

  const onHeroClick = (e) => {
    if (prefersReducedMotion()) return
    const host = sectionRef.current
    if (!host) return
    const r = host.getBoundingClientRect()
    ;['', 'r2'].forEach(cls => {
      const s = document.createElement('span')
      s.className = `hero-ripple ${cls}`.trim()
      s.style.left = `${e.clientX - r.left}px`
      s.style.top = `${e.clientY - r.top}px`
      host.appendChild(s)
      setTimeout(() => s.remove(), 1200)
    })
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onClick={onHeroClick}
      className="relative min-h-[100dvh] overflow-hidden bg-[#0a1a26]"
    >
      {/* FULL-BLEED PHOTOGRAPH with parallax + Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={imgRef}
          src={IMG.heroSubject}
          alt="A single droplet hitting still water, creating concentric ripples"
          className="ken-burns absolute inset-0 w-full h-full object-cover will-change-transform"
          loading="eager"
        />
      </div>

      {/* Legibility gradient */}
      <div className="absolute inset-0"
           style={{ background: 'linear-gradient(180deg, rgba(10,26,38,0.30) 0%, rgba(10,26,38,0.10) 35%, rgba(10,26,38,0.70) 100%)' }} />

      {/* CONTENT (scroll-fades) */}
      <div className="absolute inset-0 z-10 flex">
        <div ref={contentRef} className="mx-auto max-w-[1240px] w-full px-6 md:px-10 flex flex-col justify-end pb-[14vh] md:pb-[16vh] will-change-transform">
          <h1 className="display h-hero text-white max-w-4xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
            <span className="word-rise inline-block" style={{ animationDelay: '0.15s' }}>Where</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.30s' }}>pure</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.45s' }}>water</span>
            <br/>
            <span className="word-rise inline-block" style={{ animationDelay: '0.65s' }}>flows</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.80s' }}>daily.</span>
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 fade-up" style={{ animationDelay: '1.05s' }}>
            <a href="#stores"
               onClick={() => trackEvent('hero_find_store')}
               className="group inline-flex items-center justify-center px-7 py-[15px] rounded-full bg-white text-[#0a1a26] font-medium text-[14.5px] transition-all duration-200 ease-out hover:bg-[#5BC8E6] hover:-translate-y-0.5 active:scale-[0.97]">
              Find your nearest store
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.2} />
            </a>
            <a href="#balance"
               onClick={() => trackEvent('hero_check_balance')}
               className="group inline-flex items-center justify-center px-6 py-[14px] rounded-full bg-white/10 border border-white/30 backdrop-blur-md text-white font-medium text-[14.5px] transition-all duration-200 ease-out hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97]">
              <Droplet className="w-4 h-4 mr-2" strokeWidth={2.2} />
              Check your balance
            </a>
            <a href="#plans" onClick={() => trackEvent('hero_see_plans')} className="text-[14px] text-white font-medium underline underline-offset-4 decoration-[#5BC8E6] decoration-2 hover:decoration-white transition-colors ml-1">
              See plans
            </a>
          </div>
        </div>
      </div>

      {/* Soft seam into the next section */}
      <div className="absolute bottom-0 inset-x-0 h-20 z-[5] bg-gradient-to-b from-transparent to-white/90 pointer-events-none" />
    </section>
  )
}

/* ─────── TRUST BAR — heritage + the competitive wedge, straight under the hero ─────── */
/* Every figure here is verified (3 stores, daily hours, 4.4/68 Google, member price).
   Founded 1998 (first store) — heritage copy uses "since 1998", a specific year that
   matches how the Fremont competitor markets ("since 1985"). */
function TrustBar() {
  const stats = [
    { icon: MapPin,  big: '3',        small: 'Locations across Fremont & Newark' },
    { icon: Clock,   big: 'Every day', small: 'Open 10a to 7p, no days off' },
    { icon: Star,    big: '4.1★',     small: '180+ Google reviews, 3 stores' },
    { icon: Droplet, big: '$0.375',   small: 'Per gallon for members' },
  ]
  return (
    <section className="relative bg-white px-6 md:px-10 py-14 md:py-20 border-b border-[#0A1220]/06">
      <div className="mx-auto max-w-[1240px]">
        <p className="reveal eyebrow text-[#1E588A] mb-9 md:mb-12">
          Family-owned in Fremont &amp; Newark
        </p>
        <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-0 md:divide-x md:divide-[#0A1220]/10">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="flex flex-col md:px-8 first:md:pl-0">
                <Icon className="w-4 h-4 text-[#1E588A]" strokeWidth={2.2} />
                <span className="display text-[40px] md:text-[52px] leading-none text-[#0A1220] mt-3">{s.big}</span>
                <span className="text-[13.5px] text-[#0A1220]/55 mt-2 leading-snug">{s.small}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────── REVIEWS ─────────────────────── */
const REVIEWS = [
  {
    quote: "I drive FAR to get water here. Why? Because their water is the best! Once you've started drinking their water, you won't be able to drink any other. It's almost insulting to buy Glacier water from Lucky's across the lot when you can get water from here instead.",
    highlights: ['their water is the best!'],
    name: 'Mango T.',
  },
  {
    quote: "The water quality is PERFECT! It tastes better than bottled water. My cousin has been coming here all the way from Redwood City. If the gas and the bridge tolls don't prove the loyalty, I don't know what will.",
    highlights: ['The water quality is PERFECT!', 'coming here all the way from Redwood City'],
    name: 'Norma D.',
  },
  {
    quote: "Love this place! We've been going here for more than 8 years and I can't see getting quality water anywhere else. We go through 5 five-gallon containers a week. Trust me, this place is great!",
    highlights: ["I can't see getting quality water anywhere else.", 'more than 8 years'],
    name: 'Rochell S.',
  },
  {
    quote: "A++ great water. Wish I had all that money back that we wasted on bottled water.",
    highlights: ['A++ great water.'],
    name: 'T J.',
  },
]

function QuoteText({ quote, highlights = [], className }) {
  const parts = []
  let rest = quote
  let k = 0
  while (rest.length) {
    let best = null
    for (const h of highlights) {
      if (!h) continue
      const idx = rest.indexOf(h)
      if (idx !== -1 && (best === null || idx < best.idx)) best = { idx, h }
    }
    if (!best) { parts.push(rest); break }
    if (best.idx > 0) parts.push(rest.slice(0, best.idx))
    parts.push(<strong key={k++} className="font-semibold text-[#0A1220]">{best.h}</strong>)
    rest = rest.slice(best.idx + best.h.length)
  }
  return <p className={className}>&ldquo;{parts}&rdquo;</p>
}

function RatingStars({ rating }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))
  return (
    <div className="relative inline-flex w-fit" role="img" aria-label={`${rating} out of 5 stars`}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-5 h-5 text-[#0A1220]/15" fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-5 h-5 shrink-0 text-[#F5A623]" fill="#F5A623" strokeWidth={0} />
        ))}
      </div>
    </div>
  )
}

function VerifiedTag() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#0A1220]/55">
      <span className="w-1 h-1 rounded-full bg-[#0A1220]/30" />
      Verified customer review
    </span>
  )
}

function ReviewCard({ r, featured = false }) {
  return (
    <div className={`reveal card bg-white relative overflow-hidden flex flex-col ${featured ? 'p-8 md:p-12' : 'p-7 md:p-8'}`}>
      <span aria-hidden="true" className={`absolute -top-1 right-5 leading-none font-bold text-[#1E588A]/[0.07] select-none pointer-events-none ${featured ? 'text-[150px]' : 'text-[96px]'}`}>&rdquo;</span>
      <QuoteText
        quote={r.quote}
        highlights={r.highlights}
        className={`relative mt-5 flex-1 text-[#0A1220]/65 ${featured ? 'text-[20px] md:text-[26px] leading-[1.45] max-w-3xl' : 'text-[15.5px] leading-relaxed'}`}
      />
      <div className="relative mt-6 flex items-center gap-2.5">
        <span className={`font-semibold text-[#0A1220] ${featured ? 'text-[16px]' : 'text-[14px]'}`}>{r.name}</span>
        <VerifiedTag />
      </div>
    </div>
  )
}

function Reviews() {
  return (
    <section id="reviews" className="relative py-24 md:py-32 px-6 md:px-10 bg-[#F4F7FA]">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-16 md:mb-24">
          <WordReveal
            as="h2"
            className="display h-lead text-[#0A1220]"
            text="Delivering the best value water in Fremont since 1998."
          />
          {/* Store gallery — TODO: swap these placeholder images for real store photos */}
          <div className="reveal mt-8 md:mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4 md:h-[460px]">
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-square md:aspect-auto md:col-span-2 md:row-span-2 ring-1 ring-[#0A1220]/06">
              <img src={IMG.introBottle} alt="Le Water bottle" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-square md:aspect-auto md:col-span-2 ring-1 ring-[#0A1220]/06">
              <img src={IMG.splash} alt="Purified water" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-square md:aspect-auto ring-1 ring-[#0A1220]/06">
              <img src={IMG.glass} alt="A glass of Le Water" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-square md:aspect-auto ring-1 ring-[#0A1220]/06">
              <img src={IMG.heroSubject} alt="A single water droplet" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>

        <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <h2 className="display h-title text-[#0A1220]">
            What our<br/><span className="text-[#0A1220]/40">customers say.</span>
          </h2>
          <div className="flex items-center gap-4">
            <span className="display text-[52px] leading-none text-[#0A1220]">4.1</span>
            <div>
              <RatingStars rating={4.1} />
              <div className="text-[13px] text-[#0A1220]/55 mt-1.5">
                <span className="font-semibold text-[#0A1220]">180+</span> Google reviews across our three stores
              </div>
            </div>
          </div>
        </div>

        <ReviewCard r={REVIEWS[0]} featured />

        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {REVIEWS.slice(1).map((r) => (
            <ReviewCard key={r.name} r={r} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── PLANS ────────────────────────────── */
function Plans() {
  const cards = [
    {
      kind: 'Pay as you go',
      title: 'No plan',
      sub: 'Walk in, refill, pay.',
      featured: false,
      lines: [
        { label: 'Regular water', price: '$0.50', unit: '/gal' },
        { label: 'Alkaline water', price: '$1.30', unit: '/gal' },
      ],
      bullets: ['No commitment', 'Any container welcome'],
    },
    {
      kind: 'Prepaid · Regular',
      title: '120 gallons',
      sub: '$45 one-time',
      featured: true,
      highlight: { from: '$0.50', to: '$0.375', save: '25%', label: 'effective per gallon' },
      bullets: ['Tracked by phone number', 'Never expires', 'Use across all 3 stores'],
    },
    {
      kind: 'Prepaid · Alkaline',
      title: '100 gallons',
      sub: '$90 one-time',
      featured: true,
      highlight: { from: '$1.30', to: '$0.90', save: '31%', label: 'effective per gallon' },
      bullets: ['Tracked by phone number', 'Never expires', 'Use across all 3 stores'],
    },
  ]

  return (
    <section id="plans" className="relative py-24 md:py-32 px-6 md:px-10 bg-white">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal max-w-2xl mb-12 md:mb-16">
          <h2 className="display h-title text-[#0A1220]">
            Ultra pure water.
            <span className="block text-[#1E588A] md:whitespace-nowrap">Members save <span className="font-bold">over 25%</span>.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#0A1220]/60 max-w-md">
            Pay as you go, or prepay once and save on every gallon. Your balance follows your phone number.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className="reveal"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className={`card relative h-full p-7 md:p-8 flex flex-col ${c.featured ? 'text-white border-transparent' : ''}`}
                style={c.featured ? { background: '#0A1220' } : undefined}
              >
                <div className={`eyebrow ${c.featured ? 'text-white/55' : 'text-[#0A1220]/45'} mb-8`}>
                  {c.kind}
                </div>

                <div className="mb-8">
                  <div className={`display text-[40px] md:text-[44px] leading-[0.95] ${c.featured ? 'text-white' : 'text-[#0A1220]'}`}>
                    {c.title}
                  </div>
                  <div className={`mt-2 text-[14px] ${c.featured ? 'text-white/55' : 'text-[#0A1220]/50'}`}>{c.sub}</div>
                </div>

                {c.lines && (
                  <div className="space-y-3 mb-8 pb-7 border-b border-[#0A1220]/10">
                    {c.lines.map(l => (
                      <div key={l.label} className="flex items-baseline justify-between">
                        <span className="text-[14.5px] text-[#0A1220]/75">{l.label}</span>
                        <span className="text-[#0A1220]">
                          <span className="text-[20px] font-semibold tracking-tight">{l.price}</span>
                          <span className="text-[#0A1220]/45 text-[11px] ml-1">{l.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {c.highlight && (
                  <div className="relative mb-8 rounded-2xl border border-white/12 bg-white/5 p-5 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#5BC8E6]/15 blur-3xl pointer-events-none" />
                    <div className="relative flex items-baseline gap-3">
                      <span className="text-white/40 line-through text-[14px]">{c.highlight.from}/gal</span>
                      <span className="display text-white text-[34px] leading-none">{c.highlight.to}</span>
                      <span className="text-white/60 text-[12px]">/ gal</span>
                    </div>
                    <div className="relative flex items-center justify-between mt-3">
                      <span className="text-white/55 text-[11.5px]">{c.highlight.label}</span>
                      <span className="text-[10.5px] uppercase tracking-[0.16em] font-semibold text-[#0a1a26] bg-[#5BC8E6] px-2 py-1 rounded-full">
                        Save {c.highlight.save}
                      </span>
                    </div>
                  </div>
                )}

                <ul className={`space-y-2.5 mb-8 text-[14px] ${c.featured ? 'text-white/75' : 'text-[#0A1220]/75'}`}>
                  {c.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className={`w-3.5 h-3.5 mt-1 ${c.featured ? 'text-white' : 'text-[#1E588A]'}`} strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────── BALANCE PORTAL ──────────────────────────── */
function Balance() {
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('idle') // idle | loading | result | notfound | error
  const [accounts, setAccounts] = useState([])
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return
    setState('loading')
    setError('')
    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setState('error')
        return
      }
      if (data.found && data.accounts?.length) {
        setAccounts(data.accounts)
        setRecent(Array.isArray(data.recent) ? data.recent : [])
        setState('result')
        trackEvent('balance_lookup', { result: 'found' })
      } else {
        setState('notfound')
        trackEvent('balance_lookup', { result: 'not_found' })
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setState('error')
      trackEvent('balance_lookup', { result: 'error' })
    }
  }

  const reset = () => { setState('idle'); setAccounts([]); setRecent([]); setError(''); setPhone('') }

  // Whether the store name is worth showing (only if balances span >1 store)
  const multiStore = new Set(accounts.map((a) => a.store)).size > 1
  const multiPlan = new Set(accounts.map((a) => a.plan)).size > 1
  const fmtActivityDate = (s) => {
    const d = new Date(s)
    // Pin to store-local (Pacific) so the date is the same for every viewer.
    return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
  }
  const showForm = state === 'idle' || state === 'loading'
  const planStyle = (plan) => plan === 'Alkaline'
    ? { backgroundColor: '#DBEAFE', color: '#2563EB' }
    : { backgroundColor: '#E0F2FE', color: '#0891B2' }

  return (
    <section id="balance" className="relative py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal max-w-2xl mb-12 md:mb-16">
          <h2 className="display h-title text-[#0A1220]">
            Check your<br/><span className="text-[#1E588A]">balance.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#0A1220]/60 max-w-md">
            Prepaid plans are tracked by phone number. Look up your remaining gallons any time.
          </p>
        </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        {/* LEFT — plan comparison */}
        <div className="reveal md:col-span-5 grid gap-4" style={{ transitionDelay: '120ms' }}>
          <PlanStat
            kind="Regular plan"
            from="$0.50"
            to="$0.375"
            save="25%"
            qty="120 gallons for $45"
            tint="ink"
          />
          <PlanStat
            kind="Alkaline plan"
            from="$1.30"
            to="$0.90"
            save="31%"
            qty="100 gallons for $90"
            tint="accent"
          />
        </div>

        <div className="reveal md:col-span-7" style={{ transitionDelay: '200ms' }}>
          <div className="card !rounded-[28px] p-7 md:p-9 shadow-[0_40px_80px_-40px_rgba(10,18,32,0.18)]">
            <div className="flex items-center gap-2.5 mb-7">
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#0A1220] text-white">
                <JugMark className="w-4 h-4" />
              </span>
              <span className="text-[13.5px] font-medium">Look up your account</span>
            </div>

            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.form
                  key="form" onSubmit={submit}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <label className="block eyebrow text-[#0A1220]/50 mb-2.5">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A1220]/35" strokeWidth={2} />
                    <input
                      type="tel" inputMode="numeric"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      disabled={state === 'loading'}
                      className="input caret-[#1E588A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={state === 'loading' || phone.replace(/\D/g,'').length < 10}
                    className="btn btn-primary w-full mt-4 !py-4 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {state === 'loading' ? (
                      <span className="flex items-center gap-1.5">
                        <span className="dot" /><span className="dot" style={{ animationDelay: '0.15s' }} /><span className="dot" style={{ animationDelay: '0.3s' }} />
                      </span>
                    ) : (
                      <>Check balance <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.2} /></>
                    )}
                  </button>

                  <p className="text-[11.5px] text-[#0A1220]/55 mt-4 text-center">
                    Enter the phone number on your prepaid plan.
                  </p>
                </motion.form>
              ) : state === 'result' ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {accounts.length === 1 ? (
                    <>
                      <div className="eyebrow text-[#0A1220]/50 mb-3">
                        {accounts[0].plan} remaining{multiStore ? ` · ${accounts[0].store}` : ''}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <motion.span
                          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
                          className="display text-[80px] md:text-[96px] leading-none"
                          style={{ color: planStyle(accounts[0].plan).color }}
                        >
                          {accounts[0].gallons}
                        </motion.span>
                        <span className="text-[#0A1220]/55 text-[15px]">gallons</span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[12px]" style={planStyle(accounts[0].plan)}>
                        <Droplet className="w-3 h-3" strokeWidth={2.5} /> {accounts[0].plan} plan · active
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="eyebrow text-[#0A1220]/50 mb-4">Your balances</div>
                      <div className="space-y-3">
                        {accounts.map((a, i) => (
                          <motion.div
                            key={`${a.store}-${a.plan}`}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: EASE }}
                            className="flex items-center justify-between rounded-2xl border border-[#0A1220]/08 px-4 py-3.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full" style={planStyle(a.plan)}>
                                <Droplet className="w-4 h-4" strokeWidth={2.4} />
                              </span>
                              <div>
                                <div className="text-[13.5px] font-medium" style={{ color: planStyle(a.plan).color }}>{a.plan}</div>
                                {multiStore && <div className="text-[11.5px] text-[#0A1220]/50">{a.store}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="display text-[26px] leading-none" style={{ color: planStyle(a.plan).color }}>{a.gallons}</span>
                              <span className="text-[#0A1220]/50 text-[12px] ml-1">gal</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {recent.length > 0 && (
                    <div className="mt-7">
                      <div className="eyebrow text-[#0A1220]/50 mb-3">Recent activity</div>
                      <div className="rounded-2xl border border-[#0A1220]/08 divide-y divide-[#0A1220]/06 overflow-hidden">
                        {recent.map((r, i) => (
                          <motion.div
                            key={`${r.date}-${i}`}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease: EASE }}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[12px] text-[#0A1220]/45 tabular-nums w-12 shrink-0">{fmtActivityDate(r.date)}</span>
                              <span className="text-[13.5px] text-[#0A1220] truncate">
                                {r.label}
                                {(multiPlan || multiStore) && (
                                  <span className="text-[#0A1220]/45">
                                    {multiPlan ? ` · ${r.plan}` : ''}{multiStore ? ` · ${r.store}` : ''}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[13.5px] font-medium tabular-nums" style={{ color: r.delta < 0 ? '#0A1220' : '#127a45' }}>
                                {r.delta > 0 ? '+' : ''}{r.delta} gal
                              </span>
                              <span className="text-[11.5px] text-[#0A1220]/45 ml-2 tabular-nums">{r.balance} left</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={reset} className="btn btn-ghost w-full mt-7">
                    Check another number
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="text-center py-4"
                >
                  <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-[#ECF4F9] text-[#1E588A] mb-4">
                    <Droplet className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  {state === 'notfound' ? (
                    <>
                      <div className="text-[16px] font-medium text-[#0A1220]">No plan on that number</div>
                      <p className="text-[13.5px] text-[#0A1220]/55 mt-2 max-w-xs mx-auto">
                        We could not find a prepaid plan for that phone. Start one at any store, or double-check the number.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-[16px] font-medium text-[#0A1220]">Lookup failed</div>
                      <p className="text-[13.5px] text-[#0A1220]/55 mt-2 max-w-xs mx-auto">{error}</p>
                    </>
                  )}
                  <button onClick={reset} className="btn btn-ghost w-full mt-6">
                    Try another number
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

function PlanStat({ kind, from, to, save, qty, tint = 'ink' }) {
  const isAccent = tint === 'accent'
  return (
    <div className={`relative rounded-2xl p-6 md:p-7 border ${isAccent ? 'bg-[#ECF4F9] border-[#1E588A]/15' : 'bg-[#0A1220] border-transparent text-white'}`}>
      <div className={`eyebrow ${isAccent ? 'text-[#1E588A]/70' : 'text-white/55'} mb-3`}>{kind}</div>
      <div className="flex items-baseline gap-3">
        <span className={`text-[14px] line-through ${isAccent ? 'text-[#0A1220]/40' : 'text-white/40'}`}>{from}/gal</span>
        <span className={`display text-[36px] md:text-[42px] leading-none ${isAccent ? 'text-[#1E588A]' : 'text-white'}`}>{to}<span className="text-[15px] opacity-60">/gal</span></span>
      </div>
      <div className={`mt-3 text-[13px] ${isAccent ? 'text-[#0A1220]/65' : 'text-white/65'}`}>{qty}</div>
      <span className={`absolute top-5 right-5 text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-1 rounded-full ${isAccent ? 'bg-[#1E588A] text-white' : 'bg-white text-[#0A1220]'}`}>
        Save {save}
      </span>
    </div>
  )
}

/* ──────────────────────────────── STORES ──────────────────────────────── */
const STORES = [
  {
    name: 'Le Water Store',
    area: 'North Fremont',
    slug: 'fremont-north',
    address: '35762 Fremont Blvd',
    city: 'Fremont, CA 94536',
    phone: '+15107425699',
    phoneDisplay: '(510) 742-5699',
    close: 19,
    lat: 37.567202, lng: -122.024635,
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2355.5412405638453!2d-122.02463516558994!3d37.567202004484315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbfb8ef254513%3A0xd6d91d5ffd25f275!2sLe%20Water%20Store!5e0!3m2!1sen!2sus!4v1775966296778!5m2!1sen!2sus',
  },
  {
    name: 'Le Pure Water',
    area: 'Central Fremont',
    slug: 'fremont-central',
    address: '39409 Fremont Blvd',
    city: 'Fremont, CA 94538',
    phone: '+15106561533',
    phoneDisplay: '(510) 656-1533',
    close: 19,
    lat: 37.544543, lng: -121.981806,
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d443.3435900306666!2d-121.9818062651175!3d37.54454328153434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fc099ea00a6df%3A0xd07f330bc4f9bc40!2sLe%20Pure%20Water!5e0!3m2!1sen!2sus!4v1775966346126!5m2!1sen!2sus',
  },
  {
    name: 'Lion Pure Water',
    area: 'Newark',
    slug: 'newark',
    address: '39131 Cedar Blvd',
    city: 'Newark, CA 94560',
    phone: '+15107396225',
    phoneDisplay: '(510) 739-6225',
    close: 18.5,
    lat: 37.523282, lng: -122.025403,
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12657.393896206348!2d-122.0254025128418!3d37.52328200000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbf4f97bf0b91%3A0xfa73f395892b1f80!2sLion%20Pure%20Water!5e0!3m2!1sen!2sus!4v1775966372825!5m2!1sen!2sus',
  },
]

const directionsUrl = (s) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.name}, ${s.address}, ${s.city}`)}`

function StoreCard({ s, i }) {
  const status = openStatus(undefined, s.close)
  return (
    <motion.article
      layout
      transition={{ layout: { duration: 0.5, ease: EASE } }}
      onClick={(e) => { if (s.slug && !e.target.closest('a, button, iframe')) window.location.href = `/${s.slug}` }}
      className={`reveal card overflow-hidden flex flex-col h-full ${s.slug ? 'cursor-pointer' : ''}`}
      style={{ transitionDelay: `${i * 90}ms` }}
    >
      {/* Map */}
      <div className="relative h-[200px] overflow-hidden border-b border-[#0A1220]/06">
        <iframe
          src={s.src}
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          title={`Map to ${s.name}`}
        />
        {s.nearest && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#0A1220] text-white shadow-sm">
            <Navigation className="w-3 h-3" strokeWidth={2.4} /> Nearest you
          </span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[18px] tracking-tight text-[#0A1220]">{s.name}</h3>
            <p className="text-[13px] text-[#0A1220]/55 mt-0.5">
              {s.area}{typeof s.miles === 'number' ? ` · ${s.miles.toFixed(1)} mi away` : ''}
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full ${
              status.open ? 'bg-[#E4F5EC] text-[#127a45]' : 'bg-[#0A1220]/06 text-[#0A1220]/55'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-[#1B9E57] live-dot' : 'bg-[#0A1220]/35'}`} />
            {status.label}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 text-[13.5px] leading-snug text-[#0A1220]/70">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#1E588A]" strokeWidth={2} />
          <span>{s.address}<br />{s.city}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[#0A1220]/55">
          <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          Open daily, 10a to {fmtHourShort(s.close)}
        </div>
        <a href={`tel:${s.phone}`} className="mt-2 flex items-center gap-2 text-[13px] text-[#0A1220]/70 hover:text-[#1E588A] transition-colors w-fit">
          <Phone className="w-3.5 h-3.5 shrink-0 text-[#1E588A]" strokeWidth={2} />
          {s.phoneDisplay}
        </a>

        {/* Primary actions — get there or call, one tap each */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <a
            href={directionsUrl(s)}
            target="_blank" rel="noreferrer"
            onClick={() => trackEvent('get_directions', { store: s.name })}
            className="group btn btn-primary !py-3 text-[13.5px]"
          >
            <Navigation className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.2} /> Directions
          </a>
          <a
            href={`tel:${s.phone}`}
            onClick={() => trackEvent('call_store', { store: s.name })}
            className="btn btn-ghost !py-3 text-[13.5px]"
          >
            <Phone className="w-4 h-4 mr-1.5" strokeWidth={2.2} /> Call
          </a>
        </div>

        {s.slug && (
          <a
            href={`/${s.slug}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1E588A] transition-all duration-200 hover:gap-2.5"
          >
            Store details &amp; hours <span aria-hidden="true">&rarr;</span>
          </a>
        )}
      </div>
    </motion.article>
  )
}

function Stores() {
  const [userLoc, setUserLoc] = useState(null)
  const [locState, setLocState] = useState('idle') // idle | locating | done | denied

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLocState('denied'); return }
    setLocState('locating')
    trackEvent('use_my_location')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocState('done') },
      () => setLocState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }

  const ordered = userLoc
    ? STORES
        .map((s) => ({ ...s, miles: milesBetween(userLoc, s) }))
        .sort((a, b) => a.miles - b.miles)
        .map((s, idx) => ({ ...s, nearest: idx === 0 }))
    : STORES

  return (
    <section id="stores" className="relative py-24 md:py-32 px-6 md:px-10 bg-[#F4F7FA]">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div>
            <h2 className="display h-title text-[#0A1220]">
              Three stores.<br/><span className="text-[#0A1220]/40">One promise.</span>
            </h2>
            <p className="mt-4 text-[15px] text-[#0A1220]/60 max-w-sm">
              Same pure water at all three. Walk in with any container, we fill it on the spot.
            </p>
          </div>
          <button
            onClick={useMyLocation}
            disabled={locState === 'locating'}
            className="btn btn-ghost !py-2.5 !px-4 text-[13.5px] shrink-0 w-fit disabled:opacity-60"
          >
            <Navigation className="w-4 h-4 mr-1.5" strokeWidth={2.2} />
            {locState === 'locating' ? 'Finding you…'
              : locState === 'done' ? 'Sorted by nearest'
              : locState === 'denied' ? 'Location off — showing all'
              : 'Find my nearest store'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ordered.map((s, i) => (
            <StoreCard key={s.name} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────── BOTTLES SHOP PAGE ──────────────────────────── */
const PRODUCTS = [
  {
    size: '5', unitLabel: 'gallons', drops: 5,
    name: '5 Gallon',
    desc: 'The family workhorse. Fits every standard dispenser and crock.',
    tint: 'linear-gradient(160deg, #C7DFEF 0%, #9CC3DC 100%)',
  },
  {
    size: '5', unitLabel: 'gallons', drops: 5,
    name: '5 Gallon w/ Spigot', badge: 'Built-in spigot',
    desc: 'Pour straight from the counter. No dispenser needed.',
    tint: 'linear-gradient(160deg, #CBE2F0 0%, #A3C9E0 100%)',
  },
  {
    size: '3', unitLabel: 'gallons', drops: 3,
    name: '3 Gallon',
    desc: 'Same clean water, easier carry. Great for smaller kitchens.',
    tint: 'linear-gradient(160deg, #DCEBF5 0%, #B9D6E8 100%)',
  },
  {
    size: '1', unitLabel: 'gallon', drops: 1,
    name: '1 Gallon',
    desc: 'Grab-and-go size for the fridge shelf or the gym bag.',
    tint: 'linear-gradient(160deg, #EAF3F9 0%, #CFE3EF 100%)',
  },
]

function ProductCard({ p, i }) {
  return (
    <div className="reveal reveal-img card overflow-hidden flex flex-col bg-white" style={{ transitionDelay: `${i * 90}ms` }}>
      <div className="relative h-[230px] flex items-center justify-center overflow-hidden" style={{ background: p.tint }}>
        {p.badge && (
          <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1 rounded-full bg-[#0A1220] text-white">
            {p.badge}
          </span>
        )}
        <div className="text-center select-none">
          <div className="display text-[84px] leading-none text-[#1E588A]">{p.size}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#1E588A]/70 font-medium">{p.unitLabel}</div>
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: p.drops }).map((_, d) => (
              <Droplet key={d} className="w-3.5 h-3.5 text-[#1E588A]" strokeWidth={2.4} />
            ))}
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-semibold text-[16.5px] tracking-tight text-[#0A1220]">{p.name}</h3>
        <p className="text-[13px] text-[#0A1220]/60 mt-2 leading-relaxed">{p.desc}</p>
      </div>
    </div>
  )
}

function BottlesSection() {
  return (
    <>
      {/* Header */}
      <section id="bottles" className="relative pt-24 md:pt-32 pb-12 md:pb-16 px-6 md:px-10 bg-[#F4F7FA]">
        <div className="mx-auto max-w-[1240px]">
          <div className="max-w-2xl">
            <WordReveal
              as="h2"
              className="display h-title text-[#0A1220]"
              text="Bottles, sized for every home."
            />
            <p className="reveal mt-6 max-w-md text-[16px] leading-[1.55] text-[#0A1220]/65" style={{ transitionDelay: '250ms' }}>
              Every bottle is BPA-free, dispenser-ready, and made to be refilled for years, not tossed in a week.
            </p>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="px-6 md:px-10 pb-24 md:pb-32 bg-[#F4F7FA]">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCTS.map((p, i) => <ProductCard key={p.name} p={p} i={i} />)}
          </div>
          <p className="reveal mt-8 text-center text-[12.5px] text-[#0A1220]/50">
            Ask at the counter for current pricing, at any of our three stores.
          </p>
        </div>
      </section>
    </>
  )
}

/* ─────── FAQ — keyword-dense, water-forward; mirrors the FAQPage JSON-LD in index.html ─────── */
/* Answers MUST stay in sync with the FAQPage schema (Google requires visible/structured parity). */
const FAQS = [
  { q: 'What is Le Water?', a: 'Le Water is a family-owned water store with three refill locations in Fremont and Newark. Bring any container and we refill it with purified or alkaline drinking water, dispensed fresh on the spot.' },
  { q: 'How much does a water refill cost?', a: 'Purified water is $0.50 a gallon, or $0.375 a gallon on a prepaid plan. Alkaline water is $1.30 a gallon, or $0.90 a gallon prepaid. Bring any container and we fill it at the counter.' },
  { q: 'Do you offer alkaline water?', a: 'Yes. Every location offers both purified and mineral-rich alkaline drinking water at the same low per-gallon price for members.' },
  { q: 'Where are your water stores located?', a: 'Three locations: Le Water Store at 35762 Fremont Blvd, Fremont; Le Pure Water at 39409 Fremont Blvd, Fremont; and Lion Pure Water at 39131 Cedar Blvd, Newark. The Fremont stores are open 10am to 7pm daily and Newark is open 10am to 6:30pm daily.' },
  { q: 'Do I need to bring my own bottle?', a: 'Bring any clean container and we refill it, or buy a new 1, 3, or 5 gallon bottle at the counter.' },
  { q: 'How do I check my prepaid gallon balance?', a: 'Enter your phone number in the balance checker on this page. Your prepaid balance follows your phone number to any of our three stores.' },
]
function FAQ() {
  return (
    <section id="faq" className="relative py-24 md:py-32 px-6 md:px-10 bg-white">
      <div className="mx-auto max-w-[820px]">
        <div className="reveal mb-12 md:mb-16">
          <h2 className="display h-title text-[#0A1220]">
            Frequently asked<br /><span className="text-[#0A1220]/40">questions.</span>
          </h2>
        </div>
        <div className="reveal border-t border-[#0A1220]/10">
          {FAQS.map((f, i) => (
            <details key={i} className="group border-b border-[#0A1220]/10 py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-[16px] md:text-[17px] font-medium text-[#0A1220]">{f.q}</span>
                <span className="shrink-0 text-[#1E588A] text-[24px] leading-none transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[#0A1220]/70 max-w-2xl">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── FOOTER ────────────────────────────── */
function Footer() {
  return (
    <footer className="relative bg-[#0A1220] text-white/65 pt-16 md:pt-20 pb-10 px-6 md:px-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(50,140,200,0.18), transparent 60%)', filter: 'blur(40px)' }} />
      </div>
      <div className="relative mx-auto max-w-[1240px]">
        <div className="grid md:grid-cols-12 gap-10 pb-12">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white text-[#0A1220]">
                <JugMark className="w-4 h-4" />
              </span>
              <span className="font-semibold text-white">Le Water</span>
            </div>
            <h3 className="display h-title text-white max-w-xl">
              Pure water,<br/>
              <span className="text-white/40">poured with care.</span>
            </h3>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-8 md:justify-self-end text-[13.5px]">
            <div className="space-y-3">
              <div className="eyebrow text-white/55 mb-2">Explore</div>
              <a href="#plans" className="block link-u">Plans</a>
              <a href="#bottles" className="block link-u">Bottles</a>
              <a href="#balance" className="block link-u">Balance</a>
              <a href="#stores" className="block link-u">Stores</a>
              <a href="#faq" className="block link-u">FAQ</a>
            </div>
            <div className="space-y-3">
              <div className="eyebrow text-white/55 mb-2">Call a store</div>
              <a href="tel:+15107425699" className="block link-u text-white/75">North Fremont · (510) 742-5699</a>
              <a href="tel:+15106561533" className="block link-u text-white/75">Central Fremont · (510) 656-1533</a>
              <a href="tel:+15107396225" className="block link-u text-white/75">Newark · (510) 739-6225</a>
              <div className="text-white/75 pt-1">Open daily · 10a to 7p (Newark to 6:30p)</div>
            </div>
          </div>
        </div>
        <div className="hairline opacity-30 mb-6" />
        <div className="flex flex-col md:flex-row justify-between text-[12px] text-white/55 gap-2">
          <span>© {new Date().getFullYear()} Le Water. Family-owned in Fremont &amp; Newark, California.</span>
          <span>Stay hydrated.</span>
        </div>
      </div>
    </footer>
  )
}

/* Show the intro splash only on a fresh, top-level visit: skip for reduced-motion, for deep
   links (e.g. #balance — repeat customers checking gallons), and once already seen this session. */
const introEligible = () => {
  if (prefersReducedMotion() || typeof window === 'undefined') return false
  if (window.location.hash) return false
  try { return !sessionStorage.getItem('lw_seen_intro') } catch { return true }
}

/* ────────────────────────────────── APP ────────────────────────────────── */
export default function App() {
  useScrollReveal()
  const route = useHashRoute()

  const [booting, setBooting] = useState(introEligible)
  const [curtain, setCurtain] = useState(introEligible)

  useEffect(() => {
    if (!booting) return
    try { sessionStorage.setItem('lw_seen_intro', '1') } catch { /* private mode — splash just shows again */ }
    const a = setTimeout(() => setCurtain(false), 1800)  // release hero anims as curtain lifts
    const b = setTimeout(() => setBooting(false), 2850)  // unmount loader
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])

  // Anchor links scroll their section into view
  useEffect(() => {
    if (route && route.length > 1) {
      requestAnimationFrame(() => {
        document.querySelector(route)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [route])

  return (
    <main className={curtain ? 'preloading relative' : 'relative'}>
      {booting && <Loader />}
      <ScrollProgress />
      <Nav />
      <Hero />
      <TrustBar />
      <Reviews />
      <Balance />
      <Stores />
      <Plans />
      <BottlesSection />
      <FAQ />
      <Footer />
    </main>
  )
}

