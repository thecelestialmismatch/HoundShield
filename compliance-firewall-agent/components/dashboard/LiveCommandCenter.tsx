'use client'

/**
 * Live Command Center — the after-login dashboard, ported 1:1 from the
 * approved Direction-A "Live Command Center" spec. Self-contained shell
 * (own sidebar + topbar), all live behaviours (ticking KPIs, scrolling
 * throughput chart, streaming threat feed, SPRS count-up rings, detection
 * donut, engine bars, on-device Brain AI) driven by one effect with full
 * teardown. SSR-safe: every window/DOM touch lives inside useEffect.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutGrid, Activity, Shield, FileText, Brain, Settings as Cog,
  Eye, Gauge, Flag, ArrowRight, Menu, ExternalLink,
} from 'lucide-react'
import { LCC_CSS } from './lccStyles'

type TabId = 'overview' | 'feed' | 'assess' | 'reports' | 'brain' | 'settings'

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Live Operations',
  feed: 'Live Threat Feed',
  assess: 'CMMC Assessment',
  reports: 'Reports',
  brain: 'Brain AI',
  settings: 'Settings',
}

const SIDE_LINKS: { id: TabId; label: string; icon: React.ElementType; badge?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'feed', label: 'Live Threat Feed', icon: Activity, badge: true },
  { id: 'assess', label: 'CMMC Assessment', icon: Shield },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'brain', label: 'Brain AI', icon: Brain },
]

// Live threat feed event pool — [type, what, engine, latency]
const EVENTS: [string, string, string, string][] = [
  ['block', 'CUI marking "//SP-PROPIN" in prompt', 'CUI', '7ms'],
  ['pass', 'Draft weekly status email', 'clean', '11ms'],
  ['block', 'CAGE code 1ABC2 + contract #', 'CMMC', '6ms'],
  ['block', 'sk-proj-… OpenAI secret key', 'Secrets', '5ms'],
  ['quar', 'Patient MRN + diagnosis text', 'PHI', '8ms'],
  ['pass', 'Summarize public RFP language', 'clean', '12ms'],
  ['block', 'SSN 412-••-9930 in ticket', 'PII', '6ms'],
  ['pass', 'Refactor this Python function', 'clean', '9ms'],
  ['block', 'ITAR-controlled component specs', 'Export', '7ms'],
  ['quar', 'AWS AKIA… access key', 'Cloud', '6ms'],
  ['pass', 'Brainstorm blog titles', 'clean', '10ms'],
  ['block', 'Clearance "TS/SCI" + name', 'Clearance', '5ms'],
  ['pass', 'Translate marketing copy', 'clean', '13ms'],
  ['block', 'Source w/ internal hostnames', 'IP', '8ms'],
  ['quar', 'Credit card 4111 1111 …', 'PCI', '6ms'],
  ['pass', 'Explain NIST 800-171 3.1.1', 'clean', '9ms'],
]

// On-device Brain AI — deterministic keyword answers, grounded in the
// account's own (mock) assessment data. Returns [html, source].
export function brainAnswer(qRaw: string): [string, string] {
  const q = qRaw.toLowerCase()
  if (/who are you|what are you|your name/.test(q))
    return ["I'm <b>Brain AI</b>, HoundShield's on-device compliance analyst. I read your assessment, audit logs and the NIST 800-171 knowledge base — running on your hardware with your own key, so nothing I see is sent to HoundShield.", 'identity · brain-core']
  if (/what is houndshield|houndshield|what do you do/.test(q))
    return ['<b>HoundShield</b> is a local-only AI compliance firewall. It intercepts every prompt your team sends to ChatGPT, Copilot or Claude and blocks CUI, PII, PHI, secrets and CAGE codes in under 10ms — before they leave your network.', 'product · brain-core']
  if (/sprs|score/.test(q))
    return ['Your current SPRS score is <b>+78</b> of +110. 78 controls implemented, 8 partial, 14 open. Closing the three 3.8 Media Protection gaps moves you to +84 — the fastest path to conditional CMMC L2.', 'sprs · live assessment']
  if (/ready|certif|pass/.test(q))
    return ["Almost. A C3PAO needs a POA&M with no open high-weight controls. You have 2 (3.8.3 media sanitization, 3.13.11 FIPS crypto). Fix those, export the SSP + POA&M, and you're assessment-ready.", 'readiness · brain-core']
  if (/dfars|7012|spill|leak/.test(q))
    return ['A <b>DFARS 252.204-7012</b> spill is CUI reaching a system not authorized to hold it. Pasting CUI into ChatGPT transmits it to OpenAI — a reportable spill. Cloud DLP causes the same spill by sending data to their cloud. HoundShield scans locally, so CUI never leaves.', 'dfars · knowledge-base']
  return ['I can help with your CMMC posture, SPRS score, a NIST 800-171 control, HIPAA/PHI, DFARS 7012, or what HoundShield does. Everything I answer is grounded in your own assessment and audit data, on-device.', 'brain-core']
}

/** Identity shown in the sidebar footer. Omitted for the public demo, in which
 *  case the sample "Acme Defense" org is shown. */
export interface DashboardViewer {
  company: string
  plan: string
  initials: string
}

export function LiveCommandCenter({ viewer }: { viewer?: DashboardViewer } = {}) {
  const [tab, setTab] = useState<TabId>('overview')
  const [sideOpen, setSideOpen] = useState(false)
  const [feedBadge, setFeedBadge] = useState(3)

  const rootRef = useRef<HTMLDivElement>(null)
  const thruRef = useRef<HTMLCanvasElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const feedFullRef = useRef<HTMLDivElement>(null)
  const blogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabRef = useRef<TabId>('overview')
  const badgeRef = useRef(3)
  tabRef.current = tab

  // keep the badge state in sync with the imperative counter
  const bumpBadge = (n: number) => { badgeRef.current = n; setFeedBadge(n) }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const $ = (sel: string) => root.querySelector<HTMLElement>(sel)
    const timers: ReturnType<typeof setInterval>[] = []
    let raf = 0

    const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ---- bump helper ---- */
    const bump = (el: HTMLElement | null) => { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump') }

    /* ---- live clock ---- */
    const clock = $('#lcc-clock')
    timers.push(setInterval(() => { if (clock) clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) }, 1000))

    /* ---- gateway p50 jitter ---- */
    const p50 = $('#lcc-p50')
    timers.push(setInterval(() => { if (p50) p50.textContent = (5 + Math.floor(Math.random() * 5)) + 'ms' }, 1100))

    /* ---- ticking scan counter + usage bar ---- */
    let scan = 142690
    const kScan = $('#lcc-kScan')
    timers.push(setInterval(() => {
      scan += 3 + Math.floor(Math.random() * 11)
      if (kScan) { kScan.textContent = scan.toLocaleString(); bump(kScan) }
      const u = $('#lcc-useScan'); if (u) u.textContent = scan.toLocaleString() + ' / 250,000'
      const ub = $('#lcc-useBar'); if (ub) ub.style.width = Math.min(99, (scan / 250000) * 100).toFixed(0) + '%'
    }, 1200))

    /* ---- last-block-ago ---- */
    let sinceBlock = 2
    const lastBlock = $('#lcc-lastBlock')
    timers.push(setInterval(() => { sinceBlock++; if (lastBlock) lastBlock.textContent = sinceBlock + 's' }, 1000))

    /* ---- SPRS count-up + ring fill ---- */
    const countUp = (el: HTMLElement | null, to: number, dur: number) => {
      if (!el) return
      if (reduce) { el.textContent = String(to); return }
      const t0 = performance.now()
      const f = (t: number) => {
        const p = Math.min(1, (t - t0) / dur)
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        el.textContent = String(Math.round(to * e))
        if (p < 1) raf = requestAnimationFrame(f)
      }
      raf = requestAnimationFrame(f)
    }
    const fillRing = (sel: string) => {
      const r = $(sel); if (!r) return
      const pct = ((78 / 110) * 100).toFixed(0)
      r.style.background = `conic-gradient(var(--brand) ${pct}%, rgba(15,30,46,.08) 0)`
    }
    root.querySelectorAll<HTMLElement>('.ringn').forEach((e) => countUp(e, 78, 1200))
    countUp($('#lcc-kSprs'), 78, 1200)
    fillRing('#lcc-ring'); fillRing('#lcc-ring2')

    /* ---- throughput chart (scrolling) ---- */
    const cv = thruRef.current
    const series: number[] = []
    for (let i = 0; i < 60; i++) series.push(34 + Math.round(Math.random() * 30))
    const brandc = () => getComputedStyle(root).getPropertyValue('--brand').trim() || '#81A6C6'
    const orangec = () => getComputedStyle(root).getPropertyValue('--orange').trim() || '#E07B39'
    const drawChart = () => {
      if (!cv) return
      const w = cv.clientWidth; if (w < 10) return
      const h = 170, dpr = window.devicePixelRatio || 1
      cv.width = w * dpr; cv.height = h * dpr
      const x = cv.getContext('2d'); if (!x) return
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h)
      x.strokeStyle = 'rgba(15,30,46,.06)'; x.lineWidth = 1
      for (let g = 1; g < 4; g++) { const gy = (h / 4) * g; x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke() }
      const c = brandc(), max = 80, n = series.length, step = w / (n - 1)
      x.beginPath(); x.moveTo(0, h)
      for (let i = 0; i < n; i++) x.lineTo(i * step, h - (series[i] / max) * (h - 18) - 8)
      x.lineTo(w, h); x.closePath(); x.globalAlpha = 0.15; x.fillStyle = c; x.fill(); x.globalAlpha = 1
      x.beginPath()
      for (let j = 0; j < n; j++) { const lx = j * step, ly = h - (series[j] / max) * (h - 18) - 8; j ? x.lineTo(lx, ly) : x.moveTo(lx, ly) }
      x.strokeStyle = c; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke()
      const ex = (n - 1) * step, ey = h - (series[n - 1] / max) * (h - 18) - 8
      // Warm orange "live" pulse dot at the leading edge (hint-of-orange accent).
      const o = orangec()
      x.beginPath(); x.arc(ex, ey, 6, 0, 7); x.globalAlpha = 0.18; x.fillStyle = o; x.fill(); x.globalAlpha = 1
      x.beginPath(); x.arc(ex, ey, 3.5, 0, 7); x.fillStyle = o; x.fill()
    }
    timers.push(setInterval(() => { series.push(30 + Math.round(Math.random() * 36)); series.shift(); drawChart() }, 1000))
    window.addEventListener('resize', drawChart)

    /* ---- detection-mix donut ---- */
    const mix = [31, 26, 28, 15]
    let blocked = 2218
    const donutTot = $('#lcc-donutTot')
    const drawDonut = () => {
      const t = mix[0] + mix[1] + mix[2] + mix[3]
      const p = mix.map((v) => (v / t) * 100)
      const a = p[0], b = a + p[1], c2 = b + p[2]
      const donut = $('#lcc-donut')
      if (donut) donut.style.background = `conic-gradient(#81A6C6 0 ${a}%,#E5484D ${a}% ${b}%,#D9870B ${b}% ${c2}%,#0E9F6E ${c2}% 100%)`
      const set = (sel: string, val: string) => { const el = $(sel); if (el) el.textContent = val }
      set('#lcc-lgCui', Math.round(p[0]) + '%'); set('#lcc-lgSec', Math.round(p[1]) + '%')
      set('#lcc-lgPii', Math.round(p[2]) + '%'); set('#lcc-lgPhi', Math.round(p[3]) + '%')
      if (donutTot) donutTot.textContent = blocked.toLocaleString()
    }
    timers.push(setInterval(() => { for (let i = 0; i < 4; i++) mix[i] = Math.max(8, mix[i] + Math.round((Math.random() - 0.5) * 4)); drawDonut() }, 3000))

    /* ---- engine bars ---- */
    timers.push(setInterval(() => {
      root.querySelectorAll<HTMLElement>('.eng').forEach((rowEl) => {
        const base = +(rowEl.dataset.base || '0')
        const v = Math.max(6, Math.min(100, base + Math.round((Math.random() - 0.5) * 12)))
        const bar = rowEl.querySelector<HTMLElement>('i'); if (bar) bar.style.width = v + '%'
        const num = rowEl.querySelector('b'); if (num) num.textContent = String(v)
      })
    }, 1500))

    /* ---- live threat feed ---- */
    const rowHtml = (ev: [string, string, string, string]) => {
      const lbl = ev[0] === 'block' ? 'BLOCKED' : ev[0] === 'quar' ? 'QUAR' : 'PASSED'
      return `<div class="feed-row fresh"><span class="tag ${ev[0]}">${lbl}</span><span class="what">${ev[1]}</span><span class="eng">${ev[2]}</span><span class="lat">${ev[3]}</span></div>`
    }
    const feed = feedRef.current, feedFull = feedFullRef.current
    const seed = (el: HTMLElement | null, k: number) => {
      if (!el) return
      let h = ''
      for (let i = 0; i < k; i++) h += rowHtml(EVENTS[Math.floor(Math.random() * EVENTS.length)]).replace(' fresh', '')
      el.innerHTML = h
    }
    seed(feed, 7); seed(feedFull, 18)
    let quar = 6
    const kBlock = $('#lcc-kBlock'), kQuar = $('#lcc-kQuar')
    timers.push(setInterval(() => {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)]
      if (feed) { feed.insertAdjacentHTML('afterbegin', rowHtml(ev)); if (feed.children.length > 7) feed.removeChild(feed.lastChild!) }
      if (feedFull) { feedFull.insertAdjacentHTML('afterbegin', rowHtml(ev)); if (feedFull.children.length > 18) feedFull.removeChild(feedFull.lastChild!) }
      if (ev[0] === 'block') {
        blocked++; if (kBlock) { kBlock.textContent = blocked.toLocaleString(); bump(kBlock) }
        if (donutTot) donutTot.textContent = blocked.toLocaleString()
        sinceBlock = 0; if (lastBlock) lastBlock.textContent = '0s'
        if (tabRef.current !== 'feed') bumpBadge(badgeRef.current + 1)
      }
      if (ev[0] === 'quar') { quar++; if (kQuar) { kQuar.textContent = String(quar); bump(kQuar) } }
    }, 2100))

    /* ---- Brain AI chat ---- */
    const blog = blogRef.current, bi = inputRef.current
    const add = (role: 'u' | 'b', html: string, src?: string) => {
      if (!blog) return
      const b = document.createElement('div')
      b.className = 'bub ' + role
      b.innerHTML = html + (src ? `<span class="src">source: ${src}</span>` : '')
      blog.appendChild(b); blog.scrollTop = blog.scrollHeight
    }
    // Escape the operator's free-text before it touches innerHTML — the only
    // untrusted path in this component (all other strings are static literals).
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const ask = (q: string) => {
      if (!q.trim()) return
      add('u', esc(q))
      if (bi) bi.value = ''
      setTimeout(() => { const a = brainAnswer(q); add('b', a[0], a[1]) }, 420)
    }
    const onSend = () => ask(bi?.value || '')
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') ask(bi?.value || '') }
    const sendBtn = $('#lcc-bsend')
    sendBtn?.addEventListener('click', onSend)
    bi?.addEventListener('keydown', onKey)
    const chipHandlers: { el: Element; fn: () => void }[] = []
    root.querySelectorAll('.chips button').forEach((c) => {
      const fn = () => ask(c.textContent || '')
      c.addEventListener('click', fn); chipHandlers.push({ el: c, fn })
    })

    /* ---- kick everything off ---- */
    drawChart(); drawDonut()

    return () => {
      timers.forEach(clearInterval)
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', drawChart)
      sendBtn?.removeEventListener('click', onSend)
      bi?.removeEventListener('keydown', onKey)
      chipHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
    }
  }, [])

  // reset the unread badge when the operator opens the feed tab
  useEffect(() => { if (tab === 'feed') bumpBadge(0) }, [tab])

  const tabClass = (id: TabId) => (tab === id ? 'atab on' : 'atab')

  return (
    <div className="hs-lcc" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: LCC_CSS }} />
      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className={`side${sideOpen ? ' open' : ''}`}>
          <div className="brand">
            <Image src="/houndshield-logo.png" alt="HoundShield" width={28} height={36} />
            <span>Hound<b>Shield</b></span>
          </div>
          <div className="gh">Command Center</div>
          {SIDE_LINKS.map((s) => {
            const Icon = s.icon
            return (
              <button key={s.id} type="button" className={`slink${tab === s.id ? ' on' : ''}`} onClick={() => { setTab(s.id); setSideOpen(false) }}>
                <Icon /> {s.label}
                {s.badge && feedBadge > 0 && <span className="pp">{feedBadge}</span>}
              </button>
            )
          })}
          <div className="gh">Account</div>
          <button type="button" className={`slink${tab === 'settings' ? ' on' : ''}`} onClick={() => { setTab('settings'); setSideOpen(false) }}>
            <Cog /> Settings
          </button>
          <Link href="/" className="side-link" style={{ marginTop: '.4rem' }}>
            <ExternalLink /> Back to site
          </Link>
          <div className="side-foot">
            <div className="av">{viewer?.initials ?? 'AD'}</div>
            <div><div className="nm">{viewer?.company ?? 'Acme Defense'}</div><div className="sub">{viewer?.plan ?? 'Pro · 10 seats'}</div></div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <div className="top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <button type="button" className="btn btn-g btn-sm burger" aria-label="Toggle navigation" onClick={() => setSideOpen((v) => !v)}><Menu /></button>
              <div><div className="crumb">HoundShield · Command Center</div><h1>{TAB_TITLES[tab]}</h1></div>
            </div>
            <div className="top-right">
              <span className="clock" id="lcc-clock">--:--:--</span>
              <span className="statpill"><span className="dot" /> gateway live · p50 <b id="lcc-p50" style={{ color: 'var(--ok)' }}>7ms</b></span>
              <Link href="/" className="side-link" title="View marketing site"><ExternalLink /></Link>
              <div className="av">AD</div>
            </div>
          </div>

          <div className="body">
            {/* OVERVIEW */}
            <div className={tabClass('overview')}>
              <div className="ops"><span className="dot" /> <b>All systems operational</b> <span className="sep">—</span> 16/16 detection engines online <span className="sep">·</span> 4 regions <span className="sep">·</span> 0 incidents <span className="sep">·</span> last block <b id="lcc-lastBlock">4s</b> ago</div>

              <div className="kpis">
                <div className="kpi"><div className="l"><Eye /> Prompts scanned (24h)</div><div className="n bump" id="lcc-kScan">143,280</div><div className="d up">▲ live · ~46/min</div></div>
                <div className="kpi"><div className="l"><Shield /> Blocked today</div><div className="n bump" id="lcc-kBlock" style={{ color: 'var(--bad)' }}>2,233</div><div className="d">CUI · secrets · PII · PHI</div></div>
                <div className="kpi"><div className="l"><Gauge /> SPRS score</div><div className="n" id="lcc-kSprs" style={{ color: 'var(--bright)' }}>78</div><div className="d up">▲ 12 since onboarding</div></div>
                <div className="kpi"><div className="l"><Flag /> Quarantine queue</div><div className="n bump" id="lcc-kQuar" style={{ color: 'var(--warn)' }}>15</div><div className="d">awaiting human review</div></div>
              </div>

              <div className="row r-3-2">
                <div className="panel">
                  <div className="ph"><h3>Gateway throughput</h3><span className="live-tag"><span className="dot" /> live · prompts/sec</span></div>
                  <div className="pad"><canvas id="thru" ref={thruRef} height={340} width={1250} /></div>
                </div>
                <div className="panel">
                  <div className="ph"><h3>Detection mix · today</h3><span className="mono">live</span></div>
                  <div className="donut-wrap">
                    <div className="donut" id="lcc-donut"><div className="c"><b id="lcc-donutTot">2,233</b><span>blocked</span></div></div>
                    <div className="legend">
                      <div><i style={{ background: '#81A6C6' }} /> CUI <span className="v" id="lcc-lgCui">39%</span></div>
                      <div><i style={{ background: '#E5484D' }} /> Secrets <span className="v" id="lcc-lgSec">25%</span></div>
                      <div><i style={{ background: '#D9870B' }} /> PII <span className="v" id="lcc-lgPii">25%</span></div>
                      <div><i style={{ background: '#0E9F6E' }} /> PHI <span className="v" id="lcc-lgPhi">12%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row r-2-1">
                <div className="panel">
                  <div className="ph"><h3>Live threat feed</h3><span className="live-tag"><span className="dot" /> streaming · on-device</span></div>
                  <div id="feed" ref={feedRef} />
                </div>
                <div className="panel">
                  <div className="ph"><h3>SPRS posture</h3><span className="mono">NIST 800-171</span></div>
                  <div className="sprs">
                    <div className="ring" id="lcc-ring"><b className="ringn">78</b><small>of 110</small></div>
                    <div className="cap"><b>78 / 110</b> implemented · target 88 for conditional CMMC L2. 14 open · 8 in progress.</div>
                    <button type="button" className="btn btn-p btn-sm" style={{ marginTop: 14 }} onClick={() => setTab('assess')}>Open assessment <ArrowRight /></button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="ph"><h3>Detections by engine · last hour</h3><span className="live-tag"><span className="dot" /> live</span></div>
                <div className="pad">
                  <div className="eng" data-base="61"><span>CUI</span><div className="bar"><i style={{ width: '61%' }} /></div><b>61</b></div>
                  <div className="eng" data-base="48"><span>Secrets</span><div className="bar"><i style={{ width: '48%' }} /></div><b>48</b></div>
                  <div className="eng" data-base="83"><span>PII</span><div className="bar"><i style={{ width: '83%' }} /></div><b>83</b></div>
                  <div className="eng" data-base="27"><span>PHI</span><div className="bar"><i style={{ width: '27%' }} /></div><b>27</b></div>
                  <div className="eng" data-base="35"><span>Source / IP</span><div className="bar"><i style={{ width: '35%' }} /></div><b>35</b></div>
                  <div className="eng" data-base="19"><span>CAGE / contract</span><div className="bar"><i style={{ width: '19%' }} /></div><b>19</b></div>
                </div>
              </div>
            </div>

            {/* LIVE FEED */}
            <div className={tabClass('feed')}>
              <div className="ops"><span className="dot" /> <b>Streaming</b> <span className="sep">—</span> every AI prompt inspected on your hardware before it leaves the network</div>
              <div className="panel">
                <div className="ph"><h3>Intercepted prompts</h3><span className="live-tag"><span className="dot" /> live · last 60</span></div>
                <div id="feedFull" ref={feedFullRef} />
              </div>
            </div>

            {/* ASSESSMENT */}
            <div className={tabClass('assess')}>
              <div className="row r-2-1">
                <div className="panel">
                  <div className="ph"><h3>SPRS score</h3><span className="mono">live</span></div>
                  <div className="sprs"><div className="ring" id="lcc-ring2"><b className="ringn">78</b><small>of 110</small></div><div className="cap">DoD self-assessment range −203 to +110. You&apos;re at <b>+78</b>.</div></div>
                </div>
                <div className="panel">
                  <div className="ph"><h3>Fastest wins</h3><span className="mono">AI-ranked</span></div>
                  <div className="crow"><span>3.8.3 — Media sanitization</span><span className="st gap">+3 SPRS</span></div>
                  <div className="crow"><span>3.13.11 — FIPS crypto</span><span className="st gap">+3 SPRS</span></div>
                  <div className="crow"><span>3.4.2 — Config baselines</span><span className="st part">+2 SPRS</span></div>
                  <div className="crow"><span>3.1.12 — Remote access</span><span className="st part">+1 SPRS</span></div>
                </div>
              </div>
              <div className="panel" style={{ marginTop: 16 }}>
                <div className="ph"><h3>Control families · NIST 800-171</h3><span className="mono">14 domains · 110 controls</span></div>
                <div className="crow"><span>3.1 Access Control (22)</span><span className="st met">19 met</span></div>
                <div className="crow"><span>3.3 Audit &amp; Accountability (9)</span><span className="st met">9 met</span></div>
                <div className="crow"><span>3.4 Configuration Management (9)</span><span className="st part">6 partial</span></div>
                <div className="crow"><span>3.5 Identification &amp; Auth (11)</span><span className="st met">10 met</span></div>
                <div className="crow"><span>3.8 Media Protection (9)</span><span className="st gap">3 gaps</span></div>
                <div className="crow"><span>3.13 System &amp; Comms Protection (16)</span><span className="st part">11 partial</span></div>
                <div className="crow"><span>3.14 System &amp; Info Integrity (7)</span><span className="st met">7 met</span></div>
              </div>
            </div>

            {/* REPORTS */}
            <div className={tabClass('reports')}>
              <div className="cards3">
                <ReportCard icon={FileText} title="System Security Plan" body="Auto-generated SSP across all 110 controls. SHA-256 signed." done="✓ SSP_AcmeDefense.pdf" label="Generate PDF" />
                <ReportCard icon={Flag} title="POA&M" body="Plan of Action & Milestones for your 14 open controls." done="✓ POAM_AcmeDefense.pdf" label="Generate PDF" />
                <ReportCard icon={Shield} title="C3PAO Evidence Pack" body="Tamper-evident audit log mapped to NIST controls." done="✓ Evidence_2026.pdf" label="Export" />
              </div>
              <div className="panel" style={{ marginTop: 16 }}>
                <div className="ph"><h3>Recent exports</h3><span className="mono">signed · timestamped</span></div>
                <div className="crow"><span>SSP_AcmeDefense_2026-06.pdf</span><span className="mono" style={{ color: 'var(--mut2)' }}>sha256:9f3a… · 2d ago</span></div>
                <div className="crow"><span>SPRS_attestation_Q2.pdf</span><span className="mono" style={{ color: 'var(--mut2)' }}>sha256:1c08… · 5d ago</span></div>
                <div className="crow"><span>Audit_trail_May.json</span><span className="mono" style={{ color: 'var(--mut2)' }}>sha256:7be2… · 12d ago</span></div>
              </div>
            </div>

            {/* BRAIN */}
            <div className={tabClass('brain')}>
              <div className="panel">
                <div className="ph"><h3><Brain style={{ width: 15, height: 15, verticalAlign: -2, display: 'inline' }} /> Brain AI — on-device CMMC analyst</h3><span className="mono">your key · nothing sent to HoundShield</span></div>
                <div className="brain">
                  <div className="blog" ref={blogRef}>
                    <div className="bub b" dangerouslySetInnerHTML={{ __html: "I'm <b>Brain AI</b> — HoundShield's on-device compliance analyst. Ask me about your CMMC posture, a NIST control, or what HoundShield does.<span class=\"src\">running locally · your OpenRouter key</span>" }} />
                  </div>
                  <div className="chips">
                    <button type="button">Who are you?</button>
                    <button type="button">What&apos;s my SPRS score?</button>
                    <button type="button">Am I CMMC ready?</button>
                    <button type="button">What is a DFARS 7012 spill?</button>
                  </div>
                  <div className="bin"><input id="lcc-bi" ref={inputRef} placeholder="Ask Brain AI…" autoComplete="off" /><button type="button" className="btn btn-p btn-sm" id="lcc-bsend">Send</button></div>
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div className={tabClass('settings')}>
              <div className="row r-2-1">
                <div className="panel">
                  <div className="ph"><h3>Gateway</h3><span className="mono">OpenAI-compatible</span></div>
                  <div className="pad">
                    <div className="mono" style={{ fontSize: '.7rem', color: 'var(--mut2)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.4rem' }}>Proxy URL</div>
                    <CopyRow value="https://proxy.houndshield.com/v1" action="Copy" done="Copied" />
                    <div className="mono" style={{ fontSize: '.7rem', color: 'var(--mut2)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '1rem 0 .4rem' }}>API key</div>
                    <CopyRow value="hs_live_••••••••2f9a" action="Reveal" done="Revealed" />
                    <div className="mono" style={{ fontSize: '.7rem', color: 'var(--mut2)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '1rem 0 .4rem' }}>OpenRouter key · Brain AI</div>
                    <CopyRow value="sk-or-••••••••a17c" action="Edit" done="Saved" />
                  </div>
                </div>
                <div className="panel">
                  <div className="ph"><h3>Plan &amp; usage</h3><span className="mono">Pro</span></div>
                  <div className="pad">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem' }}><span style={{ color: 'var(--mut)' }}>AI gateway scans</span><b id="lcc-useScan">143,280 / 250,000</b></div>
                    <div className="usebar"><i id="lcc-useBar" style={{ width: '57%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem', marginTop: '1rem' }}><span style={{ color: 'var(--mut)' }}>Seats used</span><b>7 / 10</b></div>
                    <div className="usebar"><i style={{ width: '70%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem', marginTop: '1rem' }}><span style={{ color: 'var(--mut)' }}>Log retention</span><b>90 days</b></div>
                    <Link href="/pricing" className="btn btn-p btn-sm" style={{ marginTop: 18 }}>Upgrade to Growth <ArrowRight /></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ icon: Icon, title, body, done, label }: { icon: React.ElementType; title: string; body: string; done: string; label: string }) {
  const [text, setText] = useState(label)
  return (
    <div className="card">
      <div className="ic"><Icon /></div>
      <h4>{title}</h4>
      <p>{body}</p>
      <button type="button" className="btn btn-p btn-sm" style={{ marginTop: 14 }} onClick={() => setText(done)}>{text}</button>
    </div>
  )
}

function CopyRow({ value, action, done }: { value: string; action: string; done: string }) {
  const [label, setLabel] = useState(action)
  return (
    <div className="gw"><span>{value}</span><button type="button" onClick={() => setLabel(done)}>{label}</button></div>
  )
}
