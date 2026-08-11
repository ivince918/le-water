import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, MapPin, Phone, ArrowRight, Check, ArrowUpRight } from 'lucide-react'

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

/* ─────────── HASH ROUTER — '#/bottles' renders the shop page ─────────── */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const fn = () => setHash(window.location.hash)
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  return hash
}

/* ─────────── WORD-BY-WORD REVEAL — text fades up one word at a time ─────────── */
function WordReveal({ text, as: Tag = 'span', className = '', perWordDelay = 55, baseDelay = 0 }) {
  const words = text.split(' ')
  return (
    <Tag className={`reveal-words ${className}`}>
      {words.map((w, i) => (
        <span
          key={i}
          className="word"
          style={{ transitionDelay: `${baseDelay + i * perWordDelay}ms` }}
        >
          {w}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
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
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

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
        <a href="#" className="flex items-center gap-2 group">
          <span className={`relative inline-flex w-7 h-7 items-center justify-center rounded-full ${chip}`}>
            <JugMark className="w-4 h-4" />
          </span>
          <span className={`font-semibold tracking-tight text-[15px] ${txt}`}>Le Water</span>
        </a>
        <div className={`hidden md:flex items-center gap-9 text-[13.5px] ${sub}`}>
          <a href="#plans" className="link-u">Plans</a>
          <a href="#/bottles" className="link-u">Bottles</a>
          <a href="#balance" className="link-u">Balance</a>
          <a href="#stores" className="link-u">Stores</a>
        </div>
        <a href="#stores" className={`hidden md:inline-flex items-center text-[13px] px-4 py-2.5 rounded-full border backdrop-blur-md transition ${cta}`}>
          Find a store
        </a>
      </div>
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
        <div ref={contentRef} className="mx-auto max-w-[1280px] w-full px-6 md:px-10 flex flex-col justify-end pb-[14vh] md:pb-[16vh] will-change-transform">
          <h1 className="display text-white text-[clamp(2.8rem,7.2vw,7rem)] leading-[1.02] tracking-[-0.045em] max-w-4xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
            <span className="word-rise inline-block" style={{ animationDelay: '0.15s' }}>Where</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.30s' }}>pure</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.45s' }}>water</span>
            <br/>
            <span className="word-rise inline-block" style={{ animationDelay: '0.65s' }}>flows</span>{' '}
            <span className="word-rise inline-block" style={{ animationDelay: '0.80s' }}>daily.</span>
          </h1>
          <div className="mt-9 flex items-center gap-5 fade-up" style={{ animationDelay: '1.05s' }}>
            <a href="#stores"
               className="group inline-flex items-center justify-center px-7 py-[15px] rounded-full bg-white text-[#0a1a26] font-medium text-[14.5px] transition-all duration-200 ease-out hover:bg-[#5BC8E6] hover:-translate-y-0.5 active:scale-[0.97]">
              Find your nearest store
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.2} />
            </a>
            <a href="#plans" className="text-[14px] text-white font-medium underline underline-offset-4 decoration-[#5BC8E6] decoration-2 hover:decoration-white transition-colors">
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

/* ───────────────── INTRO STRIP — paragraph + single themed image ──────────────── */
function HeroIntro() {
  return (
    <section className="relative bg-white pt-14 md:pt-20 pb-10 md:pb-14 px-6 md:px-10">
      <div className="mx-auto max-w-[1240px] grid md:grid-cols-12 gap-8 md:gap-12 items-center">
        <WordReveal
          as="h2"
          className="md:col-span-9 display text-[clamp(1.6rem,3.4vw,2.6rem)] text-[#0A1220] leading-[1.2] tracking-[-0.03em]"
          text="Pouring alkaline water, tracking your prepaid gallons, and serving the tri city area since 2008."
        />
        <div className="reveal reveal-img md:col-span-3 relative" style={{ transitionDelay: '150ms' }}>
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(30,88,138,0.45)] ring-1 ring-[#0A1220]/06">
            <img
              src={IMG.introBottle}
              alt="A clean glass bottle filled with Le Water"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1E588A]/40 to-transparent" />
          </div>
          <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-[#5BC8E6]/35 blur-2xl pointer-events-none" />
        </div>
      </div>
    </section>
  )
}


/* ────────────────────────── MOMENTS (Bento gallery) ─────────────────────── */
function Moments() {
  return (
    <section className="relative bg-white">
      {/* Trust row */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-12 pb-2">
        <div className="reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12.5px] text-[#0A1220]/55">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1E588A]" strokeWidth={3} /> Family-owned since 2008</span>
          <span className="hidden md:inline-block w-px h-3 bg-[#0A1220]/15" />
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1E588A]" strokeWidth={3} /> 3 Fremont locations</span>
          <span className="hidden md:inline-block w-px h-3 bg-[#0A1220]/15" />
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1E588A]" strokeWidth={3} /> 320+ refills every week</span>
          <span className="hidden md:inline-block w-px h-3 bg-[#0A1220]/15" />
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1E588A]" strokeWidth={3} /> Bring any container</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16 md:py-24">
        <div className="reveal max-w-2xl mb-10">
          <h2 className="display text-[clamp(2rem,4.5vw,3.6rem)] text-[#0A1220]">
            How it works,<br/><span className="text-[#0A1220]/40">in one minute.</span>
          </h2>
        </div>

        {/* Bento grid with real images and copy tiles */}
        <div className="grid grid-cols-6 grid-rows-2 gap-4 md:gap-5 h-auto md:h-[560px]">
          {/* Tile 1 — big image */}
          <BentoTile delay={0} className="col-span-6 md:col-span-3 row-span-2 min-h-[300px]">
            <img src={IMG.refillJug} alt="Refilling a 5 gallon jug" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-7">
              <div className="text-white/75 text-[11px] tracking-[0.18em] uppercase font-medium mb-2">Step 01</div>
              <div className="text-white display text-[28px] md:text-[34px] leading-[1.05]">Bring any clean<br/>bottle or jug.</div>
              <p className="text-white/75 text-[13.5px] mt-3 max-w-xs">5 gallon, 1 gallon, even a glass growler. We work with what you bring.</p>
            </div>
          </BentoTile>

          {/* Tile 2 — Step 02 over running water */}
          <BentoTile delay={80} className="col-span-3 md:col-span-2 row-span-1 min-h-[180px]">
            <img src={IMG.heroPour} alt="Running water from the dispenser" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a26]/85 via-[#0a1a26]/55 to-[#0a1a26]/20" />
            <div className="relative h-full flex flex-col justify-between p-6">
              <div className="text-white/65 text-[11px] tracking-[0.18em] uppercase font-medium">Step 02</div>
              <div>
                <div className="text-white display text-[26px] leading-[1.05]">Pick regular<br/>or alkaline.</div>
                <p className="text-white/70 text-[12.5px] mt-2">Both filtered on-site.</p>
              </div>
            </div>
          </BentoTile>

          {/* Tile 3 — bottle shop teaser */}
          <BentoTile delay={160} className="col-span-3 md:col-span-1 row-span-1 min-h-[180px]" tone="tint">
            <a href="#/bottles" className="group relative h-full flex flex-col items-center justify-center gap-3 p-5 transition-colors hover:bg-[#ECF4F9]">
              <JugMark className="w-9 h-9 text-[#1E588A] transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="text-[12.5px] font-medium text-[#0A1220] text-center leading-snug">Need a bottle?</span>
              <span className="text-[11px] text-[#1E588A] font-medium inline-flex items-center gap-1">
                Shop sizes <ArrowUpRight className="w-3 h-3" strokeWidth={2.4} />
              </span>
            </a>
          </BentoTile>

          {/* Tile 4 — stat */}
          <BentoTile delay={220} className="col-span-3 md:col-span-2 row-span-1 min-h-[180px]" tone="tint">
            <div className="relative h-full flex flex-col justify-center p-6">
              <div className="display text-[44px] leading-none text-[#1E588A]">$0.50</div>
              <div className="text-[#0A1220]/65 text-[13px] mt-2 max-w-[180px]">per gallon to start, paid at the counter.</div>
            </div>
          </BentoTile>

          {/* Tile 5 — pH stat */}
          <BentoTile delay={280} className="col-span-3 md:col-span-1 row-span-1 min-h-[180px]" tone="ink">
            <div className="relative h-full flex flex-col justify-center items-center p-5 text-center">
              <div className="display text-[40px] leading-none text-[#5BC8E6]">9.5</div>
              <div className="text-white/60 text-[11px] tracking-[0.2em] uppercase font-medium mt-2">pH alkaline</div>
            </div>
          </BentoTile>
        </div>
      </div>
    </section>
  )
}

function BentoTile({ children, className = '', tone = 'image', delay = 0 }) {
  const toneClass =
    tone === 'ink' ? 'bg-[#0A1220]' :
    tone === 'tint' ? 'bg-[#F4F7FA] border border-[#0A1220]/06' :
    'bg-[#0A1220]'
  return (
    <div
      className={`reveal reveal-img relative rounded-2xl overflow-hidden ${toneClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
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
      cta: 'Walk in anytime',
    },
    {
      kind: 'Prepaid · Regular',
      title: '120 gallons',
      sub: '$45 one-time',
      featured: true,
      highlight: { from: '$0.50', to: '$0.375', save: '25%', label: 'effective per gallon' },
      bullets: ['Tracked by phone number', 'Never expires', 'Use across all 3 stores'],
      cta: 'Start regular plan',
    },
    {
      kind: 'Prepaid · Alkaline',
      title: '100 gallons',
      sub: '$90 one-time',
      featured: true,
      highlight: { from: '$1.30', to: '$0.90', save: '31%', label: 'effective per gallon' },
      bullets: ['Tracked by phone number', 'Never expires', 'Use across all 3 stores'],
      cta: 'Start alkaline plan',
    },
  ]

  return (
    <section id="plans" className="relative py-24 md:py-32 px-6 md:px-10 bg-[#F4F7FA]">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal max-w-2xl mb-14">
          <h2 className="display text-[clamp(2.2rem,5vw,3.8rem)] text-[#0A1220]">
            Ultra fresh water.
            <span className="block text-[#0A1220]/40">Priced for every day.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#0A1220]/60 max-w-md">
            Pay as you go, or prepay once and save on every gallon. Your balance follows your phone number, nothing to download.
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
                className={`card relative h-full p-7 md:p-8 flex flex-col ${c.featured ? 'md:py-10 text-white border-transparent' : ''}`}
                style={c.featured ? { background: '#0A1220' } : undefined}
              >
                {c.tag && (
                  <span className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.18em] font-medium px-2.5 py-1 rounded-full bg-white text-[#0A1220]">
                    {c.tag}
                  </span>
                )}

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

                <button className={`btn mt-auto w-full justify-between ${
                  c.featured
                    ? 'bg-white text-[#0A1220] hover:bg-[#ECF4F9]'
                    : 'btn-ghost'
                }`}>
                  {c.cta}
                  <ArrowUpRight className="w-4 h-4 ml-2" strokeWidth={2.2} />
                </button>
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
        setState('result')
      } else {
        setState('notfound')
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setState('error')
    }
  }

  const reset = () => { setState('idle'); setAccounts([]); setError(''); setPhone('') }

  // Whether the store name is worth showing (only if balances span >1 store)
  const multiStore = new Set(accounts.map((a) => a.store)).size > 1
  const showForm = state === 'idle' || state === 'loading'

  return (
    <section id="balance" className="relative py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal max-w-2xl mb-14">
          <h2 className="display text-[clamp(2.2rem,5vw,3.8rem)] text-[#0A1220]">
            Members save<br/><span className="text-[#1E588A]">25-31%.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#0A1220]/60 max-w-md">
            Prepaid plans are tracked by phone number. No app, no card to carry. Look up your remaining gallons any time.
          </p>
        </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        {/* LEFT — visual plan compare */}
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
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#0A1220] text-white">
                  <JugMark className="w-4 h-4" />
                </span>
                <span className="text-[13.5px] font-medium">Account lookup</span>
              </div>
              <span className="text-[11px] text-[#0A1220]/45 tracking-wide">No signup needed</span>
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
                      className="input"
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

                  <p className="text-[11.5px] text-[#0A1220]/40 mt-4 text-center">
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
                          className="display text-[80px] md:text-[96px] leading-none text-[#0A1220]"
                        >
                          {accounts[0].gallons}
                        </motion.span>
                        <span className="text-[#0A1220]/55 text-[15px]">gallons</span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#ECF4F9] text-[#1E588A] text-[12px]">
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
                              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#ECF4F9] text-[#1E588A]">
                                <Droplet className="w-4 h-4" strokeWidth={2.4} />
                              </span>
                              <div>
                                <div className="text-[13.5px] font-medium text-[#0A1220]">{a.plan}</div>
                                {multiStore && <div className="text-[11.5px] text-[#0A1220]/50">{a.store}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="display text-[26px] leading-none text-[#0A1220]">{a.gallons}</span>
                              <span className="text-[#0A1220]/50 text-[12px] ml-1">gal</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
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
function Stores() {
  const stores = [
    {
      name: 'Le Water Store',
      area: 'Fremont, North',
      hours: 'Mon to Sun, 10a to 7p',
      img: IMG.heroPour,
      src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2355.5412405638453!2d-122.02463516558994!3d37.567202004484315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbfb8ef254513%3A0xd6d91d5ffd25f275!2sLe%20Water%20Store!5e0!3m2!1sen!2sus!4v1775966296778!5m2!1sen!2sus',
    },
    {
      name: 'Le Pure Water',
      area: 'Fremont, Central',
      hours: 'Mon to Sun, 10a to 7p',
      img: IMG.heroSubject,
      src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d443.3435900306666!2d-121.9818062651175!3d37.54454328153434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fc099ea00a6df%3A0xd07f330bc4f9bc40!2sLe%20Pure%20Water!5e0!3m2!1sen!2sus!4v1775966346126!5m2!1sen!2sus',
    },
    {
      name: 'Lion Pure Water',
      area: 'Fremont, South',
      hours: 'Mon to Sun, 10a to 7p',
      img: IMG.refillJug,
      src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12657.393896206348!2d-122.0254025128418!3d37.52328200000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbf4f97bf0b91%3A0xfa73f395892b1f80!2sLion%20Pure%20Water!5e0!3m2!1sen!2sus!4v1775966372825!5m2!1sen!2sus',
    },
  ]

  return (
    <section id="stores" className="relative py-24 md:py-32 px-6 md:px-10 bg-[#F4F7FA]">
      <div className="mx-auto max-w-[1240px]">
        <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div>
            <h2 className="display text-[clamp(2.2rem,5vw,3.8rem)] text-[#0A1220]">
              Three stores.<br/><span className="text-[#0A1220]/40">One promise.</span>
            </h2>
          </div>
          <p className="text-[15px] text-[#0A1220]/60 max-w-xs">
            Bring your bottles. We handle the rest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {stores.map((s, i) => (
            <article
              key={s.name}
              className="reveal reveal-img card overflow-hidden flex flex-col"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Map */}
              <div className="relative h-[220px] overflow-hidden border-b border-[#0A1220]/06">
                <iframe
                  src={s.src}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title={s.name}
                />
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-[18px] tracking-tight text-[#0A1220]">{s.name}</h3>
                <p className="text-[13px] text-[#0A1220]/55 mt-1">{s.area}</p>
                <div className="text-[13px] text-[#0A1220]/60 flex items-center gap-2 mt-3">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  {s.hours}
                </div>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(s.name + ' Fremont')}`}
                  target="_blank" rel="noreferrer"
                  className="mt-5 inline-flex items-center text-[13.5px] font-medium text-[#0A1220] link-u w-fit"
                >
                  Get directions <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.2} />
                </a>
              </div>
            </article>
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
    name: '5 Gallon', price: '$15',
    desc: 'The family workhorse. Fits every standard dispenser and crock.',
    tint: 'linear-gradient(160deg, #C7DFEF 0%, #9CC3DC 100%)',
  },
  {
    size: '5', unitLabel: 'gallons', drops: 5,
    name: '5 Gallon w/ Spigot', price: '$20', badge: 'Built-in spigot',
    desc: 'Pour straight from the counter. No dispenser needed.',
    tint: 'linear-gradient(160deg, #CBE2F0 0%, #A3C9E0 100%)',
  },
  {
    size: '3', unitLabel: 'gallons', drops: 3,
    name: '3 Gallon', price: '$12',
    desc: 'Same clean water, easier carry. Great for smaller kitchens.',
    tint: 'linear-gradient(160deg, #DCEBF5 0%, #B9D6E8 100%)',
  },
  {
    size: '1', unitLabel: 'gallon', drops: 1,
    name: '1 Gallon', price: '$6',
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
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold text-[16.5px] tracking-tight text-[#0A1220]">{p.name}</h3>
          <span className="text-[18px] font-semibold tracking-tight text-[#0A1220] tabular-nums">{p.price}</span>
        </div>
        <p className="text-[13px] text-[#0A1220]/60 mt-2 leading-relaxed">{p.desc}</p>
        <button className="btn btn-ghost mt-5 w-full justify-between !py-3">
          View item <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

function BottlesPage() {
  return (
    <>
      {/* Header */}
      <section className="relative pt-32 md:pt-36 pb-12 md:pb-16 px-6 md:px-10 bg-white">
        <div className="mx-auto max-w-[1240px] grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-8">
            <div className="flex items-center gap-2 text-[#0A1220]/55 mb-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1E588A]" />
              <span className="eyebrow">The bottle shop</span>
            </div>
            <WordReveal
              as="h1"
              className="display text-[clamp(2.6rem,6vw,5rem)] text-[#0A1220] leading-[1.02] tracking-[-0.04em]"
              text="Bottles, sized for every home."
            />
            <p className="reveal mt-6 max-w-md text-[16px] leading-[1.55] text-[#0A1220]/65" style={{ transitionDelay: '250ms' }}>
              Every bottle is BPA-free, dispenser-ready, and made to be refilled for years, not tossed in a week.
            </p>
          </div>
          <div className="reveal reveal-img md:col-span-4" style={{ transitionDelay: '300ms' }}>
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(30,88,138,0.45)] ring-1 ring-[#0A1220]/06">
              <img
                src={IMG.introBottle}
                alt="A refillable Le Water bottle"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1E588A]/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="px-6 md:px-10 pb-20 md:pb-28 bg-white">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCTS.map((p, i) => <ProductCard key={p.name} p={p} i={i} />)}
          </div>
          <p className="reveal mt-8 text-center text-[12.5px] text-[#0A1220]/50">
            All bottles sold at the counter, at any of our three stores.
          </p>
        </div>
      </section>

      {/* Bring-your-own strip */}
      <section className="relative py-16 md:py-20 px-6 md:px-10 bg-[#0A1220] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(50,140,200,0.18), transparent 60%)', filter: 'blur(40px)' }} />
        </div>
        <div className="relative mx-auto max-w-[1240px] flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="reveal">
            <h2 className="display text-white text-[clamp(1.9rem,3.8vw,3rem)]">Already have a container?</h2>
            <p className="text-white/60 mt-3 text-[15px] max-w-md">
              Bring it in. Refills start at $0.50 per gallon, and any clean bottle works.
            </p>
          </div>
          <a href="#stores"
             className="reveal btn bg-white text-[#0A1220] hover:bg-[#5BC8E6] !px-7 !py-[15px] shrink-0"
             style={{ transitionDelay: '150ms' }}>
            Find your store <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.2} />
          </a>
        </div>
      </section>
    </>
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
            <h3 className="display text-[clamp(2rem,4.5vw,3.5rem)] text-white max-w-xl">
              Pure water,<br/>
              <span className="text-white/40">poured with care.</span>
            </h3>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-8 md:justify-self-end text-[13.5px]">
            <div className="space-y-3">
              <div className="eyebrow text-white/35 mb-2">Explore</div>
              <a href="#plans" className="block link-u">Plans</a>
              <a href="#/bottles" className="block link-u">Bottles</a>
              <a href="#balance" className="block link-u">Balance</a>
              <a href="#stores" className="block link-u">Stores</a>
            </div>
            <div className="space-y-3">
              <div className="eyebrow text-white/35 mb-2">Visit</div>
              <div>Fremont, CA</div>
              <div>Mon to Sun, 10a to 7p</div>
            </div>
          </div>
        </div>
        <div className="hairline opacity-30 mb-6" />
        <div className="flex flex-col md:flex-row justify-between text-[12px] text-white/40 gap-2">
          <span>© {new Date().getFullYear()} Le Water. Family-owned in Fremont, California.</span>
          <span>Stay hydrated.</span>
        </div>
      </div>
    </footer>
  )
}

/* ────────────────────────────────── APP ────────────────────────────────── */
export default function App() {
  useScrollReveal()
  const route = useHashRoute()
  const onBottles = route.startsWith('#/bottles')

  const [booting, setBooting] = useState(() => !prefersReducedMotion())
  const [curtain, setCurtain] = useState(() => !prefersReducedMotion())

  useEffect(() => {
    if (!booting) return
    const a = setTimeout(() => setCurtain(false), 1800)  // release hero anims as curtain lifts
    const b = setTimeout(() => setBooting(false), 2850)  // unmount loader
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])

  // Route transitions: bottles page scrolls to top; home section anchors scroll into view
  useEffect(() => {
    if (onBottles) { window.scrollTo(0, 0); return }
    if (route && route.length > 1 && !route.startsWith('#/')) {
      requestAnimationFrame(() => {
        document.querySelector(route)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [route, onBottles])

  return (
    <main className={curtain ? 'preloading relative' : 'relative'}>
      {booting && <Loader />}
      <ScrollProgress />
      <Nav dark={onBottles} />
      {onBottles ? (
        <BottlesPage />
      ) : (
        <>
          <Hero />
          <HeroIntro />
          <Moments />
          <Plans />
          <Balance />
          <Stores />
        </>
      )}
      <Footer />
    </main>
  )
}

