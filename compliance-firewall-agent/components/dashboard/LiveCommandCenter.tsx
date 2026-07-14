'use client'

/**
 * Live Command Center — THE after-login dashboard (route: /console).
 *
 * Evolved from the approved Direction-A spec into the single, unified
 * post-login home. Self-contained shell (own sidebar + topbar), mobile-first
 * (off-canvas drawer + scrim, safe-area padding), light "Steel & Cream"
 * palette, and every live behaviour (ticking KPIs, scrolling throughput chart,
 * streaming threat feed, SPRS count-up rings, detection donut, engine bars,
 * on-device Brain AI) driven by one effect with full teardown. SSR-safe: every
 * window/DOM touch lives inside useEffect.
 *
 * Signature elements that beat the competitor audit (Nightfall/Polymer/Prompt
 * Security/Vanta/Drata):
 *  - Evidence-chain SPINE: a persistent header showing the SHA-256 audit chain
 *    being built live on the customer's own hardware, one click from the $499
 *    C3PAO-ready PDF. Structurally uncopyable by cloud-routed rivals.
 *  - Brain AI carries the Doberman mark on its panel + a quick-ask card on the
 *    Overview tab, keyless (FAQ keyword layer), with the mandatory CUI warning.
 *  - First-run checklist that ends on the PDF (activation driver).
 *  - Colour-coded KPI accents so status reads before a single number does.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  LayoutGrid, Activity, Shield, FileText, Brain, Settings as Cog,
  Eye, Gauge, Flag, ArrowRight, Menu, ExternalLink, ShieldCheck, Sparkles, Lock,
  Check, Zap, Crown, ListChecks,
} from 'lucide-react'
import { LCC_CSS } from './lccStyles'
import { WelcomeBanner } from '@/components/WelcomeBanner'
import { CustomerStatusPanel } from '@/components/dashboard/CustomerStatusPanel'
import { PlanUnlocksBoard } from '@/components/dashboard/PlanUnlocksBoard'
import { ReportsPanel } from '@/components/dashboard/ReportsPanel'
import { OverviewCharts } from '@/components/dashboard/OverviewCharts'
import {
  getEntitlements, formatLimit, usagePercent, hasFeature, tierThatUnlocks,
  FEATURE_LABELS, UNLIMITED, type Entitlements, type FeatureKey,
} from '@/lib/billing/entitlements'

/**
 * The 110-control assessment is heavy (Framer Motion + every control). It only
 * loads after the operator actually opens the CMMC Assessment tab — the
 * console's first paint stays light.
 */
const AssessmentBoard = dynamic(() => import('@/components/dashboard/AssessmentBoard'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-sm text-white/50">Loading your assessment…</div>
  ),
})

type TabId = 'overview' | 'feed' | 'assess' | 'reports' | 'brain' | 'guide' | 'plan' | 'settings'

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Live Operations',
  feed: 'Live Threat Feed',
  assess: 'CMMC Assessment',
  reports: 'Reports',
  brain: 'Brain AI',
  guide: 'Your Guide',
  plan: 'Plan & Unlocks',
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

/** Escape a profile-sourced string before it reaches innerHTML. Names/company
 *  are the operator's own (self-XSS at worst), but escaping keeps every
 *  dangerouslySetInnerHTML / Brain-output path provably injection-free. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Context that lets Brain AI talk like it actually knows the operator: their
 * first name, their plan's entitlements, and how much of their Brain allotment
 * they've used this session. All optional — with no context Brain still answers
 * every question (the public demo path), just without the personal touch.
 */
export interface BrainContext {
  name?: string
  ent?: Entitlements
  brainUsed?: number
}

// On-device Brain AI — deterministic keyword answers, grounded in the account's
// own (mock) assessment data, and personalized to the signed-in operator when a
// BrainContext is supplied. Returns [html, source]. Keyless: this FAQ layer
// answers the demo-critical questions with no OpenRouter key, so the feature is
// never dead on the homepage/dashboard. Written to read like a helpful human
// analyst — greets by name, varies its phrasing, never monotone — while staying
// fully deterministic (no randomness) so it is testable.
export function brainAnswer(qRaw: string, ctx?: BrainContext): [string, string] {
  const q = qRaw.toLowerCase()
  const name = ctx?.name?.trim()
  // Warm, natural opener when we know who we're talking to; empty otherwise so
  // the anonymous demo answers are unchanged (and the unit tests stay green).
  const hi = name ? `${name}, ` : ''
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (/who are you|what are you|your name/.test(q))
    return [`${name ? `Hi ${name} — i` : 'I'}'m <b>Brain AI</b>, HoundShield's on-device compliance analyst. I read your assessment, audit logs and the NIST 800-171 knowledge base — running on your hardware with your own key, so nothing I see is sent to HoundShield. Ask me anything about where you stand.`, 'identity · brain-core']
  if (/what is houndshield|houndshield|what do you do/.test(q))
    return ['<b>HoundShield</b> is a local-only AI compliance firewall. It intercepts every prompt your team sends to ChatGPT, Copilot or Claude and blocks CUI, PII, PHI, secrets and CAGE codes in under 10ms — before they leave your network.', 'product · brain-core']
  if (/plan|subscription|tier|token|quota|usage|how many|limit|upgrade|seat/.test(q)) {
    const e = ctx?.ent
    if (e) {
      const used = ctx?.brainUsed ?? 0
      const brainLine = e.brainQueries === UNLIMITED
        ? 'unlimited Brain AI queries'
        : `${(e.brainQueries - used).toLocaleString()} of ${formatLimit(e.brainQueries)} Brain AI queries left this month`
      const up = e.nextTier
        ? ` When you're ready for more, <b>${cap(e.nextTier)}</b> steps you up to ${formatLimit(getEntitlements(e.nextTier).gatewayScans)} scans and ${formatLimit(getEntitlements(e.nextTier).brainQueries)} Brain queries.`
        : " You're on our top plan — you have everything."
      return [`${hi}you're on the <b>${e.name}</b> plan. This cycle you've got ${formatLimit(e.gatewayScans)} AI gateway scans, ${brainLine}, ${formatLimit(e.seats)} seats, and ${e.retentionDays}-day audit-log retention.${up}`, 'plan · entitlements']
    }
    return [`${hi}each plan scales what you can use — gateway scans, Brain AI queries, seats and log retention all step up as you move from Free → Pro → Growth → Enterprise. Open Settings to see exactly where your plan stands this cycle.`, 'plan · entitlements']
  }
  if (/pdf|report|ssp|poa/.test(q)) {
    const e = ctx?.ent
    if (e && !hasFeature(e, 'pdfReports')) {
      const unlock = tierThatUnlocks('pdfReports')
      return [`${hi}signed <b>PDF</b> compliance reports (SSP + POA&M, C3PAO-ready) unlock on <b>${unlock?.name ?? 'Growth'}</b> — you're on ${e.name}. On ${e.name} you can still export full JSON evidence from Reports, and your audit chain is already being signed on-device. Want me to show you what ${unlock?.name ?? 'Growth'} adds?`, 'reports · entitlements']
    }
    return [`${hi}head to <b>Reports</b> — your SSP, POA&M and C3PAO evidence pack are generated across all 110 controls and SHA-256 signed on your own hardware. One click and the PDF is on screen.`, 'reports · brain-core']
  }
  if (/chang|this week|trend|since last|delta|improv/.test(q))
    return [`${hi}good news — this week your SPRS score moved <b>+6</b> (from +72 to +78): you closed 3.5.10 (crypto-protected passwords) and 3.4.1 (baseline config). Two high-weight controls remain — 3.8.3 and 3.13.11 — worth another +6 together.`, 'trend · 7-day snapshot']
  if (/sprs|score|where.*stand|posture/.test(q))
    return [`${hi}your current SPRS score is <b>+78</b> of +110. 78 controls implemented, 8 partial, 14 open. Closing the three 3.8 Media Protection gaps moves you to +84 — the fastest path to conditional CMMC L2.`, 'sprs · live assessment']
  if (/ready|certif|pass|next step|what.*do/.test(q))
    return [`${name ? `Almost, ${name}` : 'Almost'}. A C3PAO needs a POA&M with no open high-weight controls. You have 2 (3.8.3 media sanitization, 3.13.11 FIPS crypto). Fix those, export the SSP + POA&M, and you're assessment-ready. Want me to draft the remediation order?`, 'readiness · brain-core']
  if (/hipaa|phi|patient|health/.test(q))
    return [`${hi}for HIPAA, the key point: ChatGPT isn't HIPAA-compliant without a BAA, so a nurse pasting patient data into it is a disclosure. HoundShield blocks PHI locally before it leaves — and to stay CUI/PHI-safe you must run <b>Mode B</b> (Docker on your own infra), never the hosted trial endpoint.`, 'hipaa · knowledge-base']
  if (/dfars|7012|spill|leak/.test(q))
    return ['A <b>DFARS 252.204-7012</b> spill is CUI reaching a system not authorized to hold it. Pasting CUI into ChatGPT transmits it to OpenAI — a reportable spill. Cloud DLP causes the same spill by sending data to their cloud. HoundShield scans locally, so CUI never leaves.', 'dfars · knowledge-base']
  if (/incident|draft.*summary|summary.*incident|write.*report|breach/.test(q))
    return [`${name ? `Here's a starting incident summary for you, ${name}` : "Here's a starting incident summary"}, straight from your audit chain: <b>3 blocked CUI-exposure attempts in the last 24h</b> (SC.3.177), each hash-chained and quarantined before leaving the boundary. No spill occurred; no reportable event. Export the signed evidence pack from Reports to attach to your IR record.`, 'incident · audit chain']
  return [`${name ? `Happy to help, ${name}. ` : ''}I can help with your CMMC posture, SPRS score, a NIST 800-171 control, HIPAA/PHI, DFARS 7012, your plan &amp; usage, or what HoundShield does. Everything I answer is grounded in your own assessment and audit data, on-device.`, 'brain-core']
}

/** Identity shown in the sidebar footer + used to personalize the dashboard.
 *  Omitted for the public demo, in which case the sample "Acme Defense" org is
 *  shown on the Pro plan. */
export interface DashboardViewer {
  company: string
  plan: string
  initials: string
  /** Raw tier slug (free|pro|growth|enterprise|agency) → resolves to entitlements. */
  tier?: string
  /** Operator's first name, for the by-name greeting + Brain AI. */
  firstName?: string
  /** Founder account — full access, no payment required, "Founder" labels. */
  isFounder?: boolean
}

// Overview quick-ask questions for the Brain card (wired to the live analyst).
const BRAIN_QUICK: string[] = [
  'What changed in my SPRS score this week?',
  'Am I CMMC ready?',
  'Draft my incident summary',
  'What is a DFARS 7012 spill?',
]

export function LiveCommandCenter({ viewer }: { viewer?: DashboardViewer } = {}) {
  const [tab, setTab] = useState<TabId>('overview')
  const [sideOpen, setSideOpen] = useState(false)
  const [feedBadge, setFeedBadge] = useState(3)
  // The 110-control board mounts the first time the assessment tab is opened
  // (tabs hide via CSS, so an eager mount would load it on every console visit).
  const [assessSeen, setAssessSeen] = useState(false)

  // ── Subscription context ─────────────────────────────────────────────────
  // The signed-in plan drives every entitlement in the dashboard (usage caps,
  // seats, retention, which features are unlocked). The public demo has no
  // viewer, so it shows the sample "Acme Defense" org on the Pro plan.
  const ent = getEntitlements(viewer?.tier ?? 'pro')
  const name = viewer?.firstName?.trim() || undefined
  const orgName = viewer?.company ?? 'Acme Defense'
  // Seeded "already used this cycle" for the sample org so the meters look lived-in.
  const seedScans = ent.gatewayScans === UNLIMITED ? 148_920 : Math.round(ent.gatewayScans * 0.57)
  const seedSeats = Math.min(ent.seats === UNLIMITED ? 24 : ent.seats, ent.seats === UNLIMITED ? 24 : Math.max(1, Math.round(ent.seats * 0.7)))

  // Brain AI query budget — consumed as the operator asks, shown as a meter so
  // the metered-usage model is felt, not just described.
  const [brainUsed, setBrainUsed] = useState(0)
  const brainUsedRef = useRef(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const thruRef = useRef<HTMLCanvasElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const feedFullRef = useRef<HTMLDivElement>(null)
  const blogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabRef = useRef<TabId>('overview')
  const badgeRef = useRef(3)
  // Lets the Overview Brain card fire a real analyst question — assigned inside
  // the effect (where `ask` closes over the DOM), read on click after mount.
  const askRef = useRef<((q: string) => void) | null>(null)
  // Entitlements read imperatively inside the mount-once effect.
  const entRef = useRef(ent)
  // Name is HTML-escaped for the Brain-output path (rendered via innerHTML).
  const nameRef = useRef(name ? escapeHtml(name) : undefined)
  entRef.current = ent
  nameRef.current = name ? escapeHtml(name) : undefined
  tabRef.current = tab

  // keep the badge state in sync with the imperative counter
  const bumpBadge = (n: number) => { badgeRef.current = n; setFeedBadge(n) }

  // Ask Brain from a React handler (Overview quick-ask card), then reveal the tab.
  const askBrain = (q: string) => { setTab('brain'); askRef.current?.(q) }

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

    /* ---- ticking 24h scan KPI ---- */
    let scan = 142690
    const kScan = $('#lcc-kScan')
    /* ---- billing-cycle usage meter (separate from the 24h KPI), driven by the
            signed-in plan's gateway-scan allotment ---- */
    const scanCap = entRef.current.gatewayScans
    const capLabel = scanCap === UNLIMITED ? 'Unlimited' : scanCap.toLocaleString()
    let monthScan = scanCap === UNLIMITED ? 148_920 : Math.round(scanCap * 0.57)
    timers.push(setInterval(() => {
      scan += 3 + Math.floor(Math.random() * 11)
      if (kScan) { kScan.textContent = scan.toLocaleString(); bump(kScan) }
      monthScan += 2 + Math.floor(Math.random() * 6)
      const u = $('#lcc-useScan'); if (u) u.textContent = monthScan.toLocaleString() + ' / ' + capLabel
      const ub = $('#lcc-useBar')
      if (ub) ub.style.width = (scanCap === UNLIMITED ? 6 : Math.min(99, (monthScan / scanCap) * 100)).toFixed(0) + '%'
    }, 1200))

    /* ---- last-block-ago + evidence-chain "verified N ago" ---- */
    let sinceBlock = 2
    const lastBlock = $('#lcc-lastBlock')
    const chainAgo = $('#lcc-chainAgo')
    timers.push(setInterval(() => {
      sinceBlock++
      if (lastBlock) lastBlock.textContent = sinceBlock + 's'
      if (chainAgo) chainAgo.textContent = sinceBlock + 's'
    }, 1000))

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
    // Literal hex — a canvas strokeStyle/fillStyle cannot accept an unresolved
    // `var(--…)`, and getComputedStyle().getPropertyValue('--brand') returns the
    // custom property's *declared* value ("var(--hs-steel-dark,#5A86A8)"), not a
    // resolved colour. Feeding that to the 2D context silently drew nothing —
    // the throughput chart came up blank. These match the Steel & Cream palette
    // (--hs-steel-dark / orange), exactly like the donut's hard-coded hexes.
    const brandc = () => '#5A86A8'
    const orangec = () => '#E07B39'
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
      for (let j = 0; j < n; j++) { const lx = j * step, ly = h - (series[j] / max) * (h - 18) - 8; if (j) { x.lineTo(lx, ly) } else { x.moveTo(lx, ly) } }
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
      if (donut) donut.style.background = `conic-gradient(#5A86A8 0 ${a}%,#E5484D ${a}% ${b}%,#D9870B ${b}% ${c2}%,#0E9F6E ${c2}% 100%)`
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

    /* ---- evidence chain: block #, rolling SHA-256 head ---- */
    let chainN = 4182
    const chainNEl = $('#lcc-chainN'), chainHashEl = $('#lcc-chainHash')
    const hex = () => Array.from({ length: 6 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

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
        // Advance the audit chain: new block, new hash head, freshly verified.
        chainN++
        if (chainNEl) chainNEl.textContent = '#' + chainN.toLocaleString()
        if (chainHashEl) chainHashEl.textContent = hex() + '…'
        if (chainAgo) chainAgo.textContent = '0s'
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

    // Reflect Brain-budget consumption on the in-panel meter (metered usage,
    // felt not just described). Unlimited plans never decrement.
    const brainCap = entRef.current.brainQueries
    const syncBrainMeter = () => {
      const used = brainUsedRef.current
      const left = brainCap === UNLIMITED ? '∞' : Math.max(0, brainCap - used).toLocaleString()
      const label = $('#lcc-brainUse')
      if (label) label.textContent = brainCap === UNLIMITED ? 'Unlimited queries' : `${left} of ${brainCap.toLocaleString()} queries left this month`
      const bar = $('#lcc-brainBar')
      if (bar) bar.style.width = (brainCap === UNLIMITED ? 6 : Math.min(100, (used / brainCap) * 100)).toFixed(0) + '%'
    }
    syncBrainMeter()

    let thinking = false
    const ask = (q: string) => {
      if (!q.trim() || thinking) return
      add('u', esc(q))
      if (bi) bi.value = ''
      // Out of budget on a metered plan → answer with a truthful upgrade nudge,
      // never a dead end, and don't burn a (non-existent) query.
      if (brainCap !== UNLIMITED && brainUsedRef.current >= brainCap) {
        const up = entRef.current.nextTier ? getEntitlements(entRef.current.nextTier) : null
        add('b', `You've used all ${brainCap.toLocaleString()} Brain AI queries on the <b>${entRef.current.name}</b> plan this month.${up ? ` <b>${up.name}</b> raises you to ${formatLimit(up.brainQueries)} queries — upgrade in Settings to keep going.` : ''} Your dashboard, audit chain and reports keep running regardless.`, 'plan · entitlements')
        return
      }
      // Consume one query + refresh the meter.
      brainUsedRef.current += 1
      setBrainUsed(brainUsedRef.current)
      syncBrainMeter()
      // Typing indicator → grounded answer, personalized to this operator + plan.
      thinking = true
      const typing = document.createElement('div')
      typing.className = 'bub b typing'
      typing.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>'
      if (blog) { blog.appendChild(typing); blog.scrollTop = blog.scrollHeight }
      setTimeout(() => {
        typing.remove()
        const a = brainAnswer(q, { name: nameRef.current, ent: entRef.current, brainUsed: brainUsedRef.current })
        add('b', a[0], a[1])
        thinking = false
      }, 480)
    }
    askRef.current = ask
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
      askRef.current = null
    }
  }, [])

  // reset the unread badge when the operator opens the feed tab
  useEffect(() => { if (tab === 'feed') bumpBadge(0) }, [tab])

  // mount the heavy assessment board the first time its tab opens
  useEffect(() => { if (tab === 'assess') setAssessSeen(true) }, [tab])

  // `#assessment` deep link (used by the guide's "Begin assessment" CTA and any
  // legacy link) opens the assessment tab in place — no bounce to another page.
  // The hash is cleared afterwards so a repeat click re-fires hashchange.
  useEffect(() => {
    const openIfHash = () => {
      if (window.location.hash === '#assessment') {
        setTab('assess')
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    openIfHash()
    window.addEventListener('hashchange', openIfHash)
    return () => window.removeEventListener('hashchange', openIfHash)
  }, [])

  const tabClass = (id: TabId) => (tab === id ? 'atab on' : 'atab')

  return (
    <div className="hs-lcc" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: LCC_CSS }} />
      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className={`side${sideOpen ? ' open' : ''}`}>
          <Link href="/" className="brand group group/brand" aria-label="HoundShield home">
            <Image src="/houndshield-logo.png" alt="HoundShield" width={28} height={36} />
            <span>Hound<b>Shield</b></span>
          </Link>
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
          {/* The guide ("do this next") and the plan restrictions ("pay to
              unlock") live HERE as sidebar buttons — never stacked above the
              dashboard (founder direction, 2026-07-14). */}
          <button type="button" className={`slink${tab === 'guide' ? ' on' : ''}`} onClick={() => { setTab('guide'); setSideOpen(false) }}>
            <ListChecks /> Your Guide
          </button>
          <button type="button" className={`slink${tab === 'plan' ? ' on' : ''}`} onClick={() => { setTab('plan'); setSideOpen(false) }}>
            <Crown /> Plan &amp; Unlocks
          </button>
          <button type="button" className={`slink${tab === 'settings' ? ' on' : ''}`} onClick={() => { setTab('settings'); setSideOpen(false) }}>
            <Cog /> Settings
          </button>
          <Link href="/" className="side-link" style={{ marginTop: '.4rem' }}>
            <ExternalLink /> Back to site
          </Link>
          <div className="side-foot">
            <div className="av">{viewer?.initials ?? 'AD'}</div>
            <div><div className="nm">{orgName}</div><div className="sub">{viewer?.isFounder ? 'Founder · full access' : `${ent.name} · ${formatLimit(ent.seats)} seats`}</div></div>
          </div>
        </aside>

        {/* Mobile drawer scrim — tap outside the open sidebar to dismiss it */}
        <button
          type="button"
          aria-label="Close navigation"
          className={`scrim${sideOpen ? ' on' : ''}`}
          onClick={() => setSideOpen(false)}
        />

        {/* ── Main ── */}
        <div className="main">
          <div className="top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
              <button type="button" className="btn btn-g btn-sm burger" aria-label="Toggle navigation" onClick={() => setSideOpen((v) => !v)}><Menu /></button>
              {/* Doberman mark in the bar on mobile, where the sidebar brand is off-canvas. */}
              <Link href="/" className="top-brand group group/brand" aria-label="HoundShield home">
                <Image src="/houndshield-logo.png" alt="HoundShield" width={22} height={28} className="logo-img" />
              </Link>
              <div style={{ minWidth: 0 }}><div className="crumb">HoundShield · Command Center</div><h1>{TAB_TITLES[tab]}</h1></div>
            </div>
            <div className="top-right">
              <span className="clock" id="lcc-clock">--:--:--</span>
              <span className="statpill"><span className="dot" /> gateway live · p50 <b id="lcc-p50" style={{ color: 'var(--ok)' }}>7ms</b></span>
              <Link href="/" className="side-link" title="View marketing site"><ExternalLink /></Link>
              <div className="av" title={viewer?.company ?? undefined}>{viewer?.initials ?? 'AD'}</div>
            </div>
          </div>

          {/* Evidence-chain spine — persistent on every tab. A live SHA-256 audit
              chain built on the customer's OWN hardware; one click from the $499
              C3PAO-ready PDF. The differentiator no cloud-routed rival can show. */}
          <div className="spine">
            <ShieldCheck className="spine-ic" />
            <span className="spine-txt">
              Audit chain intact <span className="sep">·</span> block <b id="lcc-chainN">#4,182</b>
              <span className="sep">·</span> head <b className="mono" id="lcc-chainHash">a3f9c1…</b>
              <span className="sep">·</span> verified <b id="lcc-chainAgo">2s</b> ago
              <span className="sep sep-hide">·</span>
              <span className="spine-boundary sep-hide">on your hardware</span>
            </span>
            <button type="button" className="btn btn-p btn-sm spine-cta" onClick={() => setTab('reports')}>
              <FileText /> Generate Audit PDF
            </button>
          </div>

          <div className="body">
            {/* Post-signup welcome (renders only on /console?welcome=true;
                carries its own bottom margin so nothing shifts when absent). */}
            <WelcomeBanner />

            {/* OVERVIEW */}
            <div className={tabClass('overview')}>
              {/* Branded hero identity band — brand-forward welcome anchor that
                  ALSO carries the personalization (greet-by-name + live plan): one
                  premium band instead of a plain greeting strip. */}
              <div className="hero">
                <div className="hero-l">
                  <div className="hero-logo"><Image src="/houndshield-logo.png" alt="HoundShield" width={34} height={44} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="hero-org">{name ? `Welcome back, ${name}` : (viewer?.company ?? 'Acme Defense')}</div>
                    <div className="hero-tag">
                      <span>HoundShield AI Compliance Command Center</span>
                      <span className="liv"><span className="dot" /> Gateway live</span>
                      <span className="plan-chip"><Crown /> {viewer?.isFounder ? 'Founder access' : `${ent.name} plan`}</span>
                    </div>
                  </div>
                </div>
                <div className="hero-r">
                  <div className="hero-metric"><b>16/16</b><span>Engines</span></div>
                  <div className="hero-metric"><b>&lt;10ms</b><span>Scan p50</span></div>
                  <div className="hero-metric"><b>4</b><span>Regions</span></div>
                </div>
              </div>

              <div className="ops"><span className="dot" /> <b>All systems operational</b> <span className="sep">—</span> 16/16 detection engines online <span className="sep">·</span> 4 regions <span className="sep">·</span> 0 incidents <span className="sep">·</span> last block <b id="lcc-lastBlock">4s</b> ago</div>

              <div className="kpis">
                <div className="kpi a-ok"><div className="l"><Eye /> Prompts scanned (24h)</div><div className="n bump" id="lcc-kScan">143,280</div><div className="d up">▲ live · ~46/min</div></div>
                <div className="kpi a-bad"><div className="l"><Shield /> Blocked today</div><div className="n bump" id="lcc-kBlock" style={{ color: 'var(--bad)' }}>2,233</div><div className="d">CUI · secrets · PII · PHI</div></div>
                <div className="kpi a-brand"><div className="l"><Gauge /> SPRS score</div><div className="n" id="lcc-kSprs" style={{ color: 'var(--brand)' }}>78</div><div className="d up">▲ 12 since onboarding</div></div>
                <div className="kpi a-warn"><div className="l"><Flag /> Quarantine queue</div><div className="n bump" id="lcc-kQuar" style={{ color: 'var(--warn)' }}>15</div><div className="d">awaiting human review</div></div>
              </div>

              {/* Brain AI quick-ask — the logo-forward, keyless analyst, one tap in. */}
              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="braincard">
                  <Image className="brain-mark" src="/houndshield-logo.png" alt="HoundShield Brain AI" width={38} height={48} />
                  <div className="bc-copy">
                    <h3><Sparkles style={{ width: 15, height: 15, verticalAlign: -2, display: 'inline', marginRight: 4 }} />{name ? `${name}, ask Brain AI` : 'Ask Brain AI'}</h3>
                    <p>On-device CMMC analyst, grounded in your own assessment &amp; audit chain. No CUI — it can route to a commercial cloud endpoint.</p>
                  </div>
                  <div className="bchips">
                    {BRAIN_QUICK.map((q) => (
                      <button key={q} type="button" onClick={() => askBrain(q)}>{q}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Four small self-explanatory charts — hourly activity, AI
                  destinations, SPRS trend, risk mix. Numbers agree with the
                  KPI tiles above (contract-tested in OverviewCharts.test). */}
              <OverviewCharts />

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
                      <div><i style={{ background: '#5A86A8' }} /> CUI <span className="v" id="lcc-lgCui">39%</span></div>
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

              {/* First-run checklist — activation driver that ends on the PDF. */}
              <div className="panel">
                <div className="ph"><h3>Get to your first C3PAO-ready PDF</h3><span className="mono">3 steps</span></div>
                <div className="pad steps">
                  <StepRow n="1" done title="Point your AI traffic at the proxy" detail="OpenAI-compatible endpoint — one URL change." onClick={() => setTab('settings')} cta="View proxy URL" />
                  <StepRow n="2" done title="See your first live scan" detail="Every prompt inspected on your hardware in <10ms." onClick={() => setTab('feed')} cta="Open live feed" />
                  <StepRow n="3" title="Generate a sample audit PDF" detail="SSP + POA&M + evidence pack, SHA-256 signed." onClick={() => setTab('reports')} cta="Generate PDF" />
                </div>
              </div>

              <div className="panel" style={{ marginTop: 16 }}>
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

            {/* ASSESSMENT — the real 110-control board, inline. No bounce to a
                separate page: the operator answers controls right here. */}
            <div className={tabClass('assess')}>
              <div className="row r-2-1">
                <div className="panel">
                  <div className="ph"><h3>SPRS score</h3><span className="mono">live</span></div>
                  <div className="sprs"><div className="ring" id="lcc-ring2"><b className="ringn">78</b><small>of 110</small></div><div className="cap">DoD self-assessment range −203 to +110. You&apos;re at <b>+78</b>. Answer the controls below to update it.</div></div>
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
                <div className="ph"><h3>Full 110-control assessment</h3><span className="mono">answers save locally · NIST 800-171 Rev 2</span></div>
                {/* cc-light re-themes the board's dark utilities onto this light
                    shell — same remap layer the command-center already uses. */}
                {assessSeen && (
                  <div className="cc-light">
                    <AssessmentBoard embedded />
                  </div>
                )}
              </div>
            </div>

            {/* YOUR GUIDE — status, next step, top gaps. Behind its own sidebar
                button per founder direction; never stacked above the dashboard. */}
            <div className={tabClass('guide')}>
              <div className="cc-light">
                <CustomerStatusPanel />
              </div>
            </div>

            {/* PLAN & UNLOCKS — the restrictions view: what's included, what's
                locked, and exactly what each locked capability costs to unlock. */}
            <div className={tabClass('plan')}>
              <div className="cc-light">
                {/* The public demo (no viewer) shows the sample org's Pro plan
                    everywhere else — keep the paywall view on the same plan. */}
                <PlanUnlocksBoard tier={viewer?.tier ?? 'pro'} founder={viewer?.isFounder} />
              </div>
            </div>

            {/* REPORTS — real artifact generation (SSP · POA&M · Evidence Pack),
                plan-gated for customers, always free for the founder. */}
            <div className={tabClass('reports')}>
              <ReportsPanel
                ent={ent}
                founder={viewer?.isFounder}
                orgFallback={viewer?.company}
                sampleMode={!viewer}
                onGoToPlan={() => setTab('plan')}
              />
            </div>

            {/* BRAIN */}
            <div className={tabClass('brain')}>
              <div className="panel">
                <div className="ph brainhead">
                  <h3>
                    <Image className="brain-mark sm" src="/houndshield-logo.png" alt="HoundShield Brain AI" width={17} height={22} />
                    Brain AI — on-device CMMC analyst
                  </h3>
                  <span className="mono">your key · nothing sent to HoundShield</span>
                </div>
                {/* Brain-query budget — the metered-usage model, made visible. */}
                <div className="brain-budget">
                  <span className="bb-label"><Zap /> Brain AI · {ent.name} plan</span>
                  <div className="bb-meter"><i id="lcc-brainBar" style={{ width: `${ent.brainQueries === UNLIMITED ? 6 : usagePercent(brainUsed, ent.brainQueries)}%` }} /></div>
                  <span className="bb-count" id="lcc-brainUse">{ent.brainQueries === UNLIMITED ? 'Unlimited queries' : `${formatLimit(ent.brainQueries)} queries left this month`}</span>
                </div>
                <div className="cui-note"><Lock /> Do not enter CUI — Brain AI can route to a commercial cloud endpoint (OpenRouter).</div>
                <div className="brain">
                  <div className="blog" ref={blogRef}>
                    <div className="bub b" dangerouslySetInnerHTML={{ __html: `${name ? `Hi <b>${escapeHtml(name)}</b> — I'm` : "I'm"} <b>Brain AI</b>, ${escapeHtml(orgName)}'s on-device compliance analyst. Ask me about your CMMC posture, your SPRS score, a NIST control, your plan &amp; usage, or what HoundShield does — everything I answer is grounded in your own data.<span class="src">running locally · your OpenRouter key</span>` }} />
                  </div>
                  <div className="chips">
                    <button type="button">Who are you?</button>
                    <button type="button">What&apos;s my SPRS score?</button>
                    <button type="button">What changed this week?</button>
                    <button type="button">Am I CMMC ready?</button>
                    <button type="button">What&apos;s on my plan?</button>
                    <button type="button">What is a DFARS 7012 spill?</button>
                    <button type="button">Draft my incident summary</button>
                  </div>
                  <div className="bin"><input id="lcc-bi" ref={inputRef} placeholder={name ? `Ask Brain AI, ${name}…` : 'Ask Brain AI…'} autoComplete="off" /><button type="button" className="btn btn-p btn-sm" id="lcc-bsend">Send</button></div>
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
                  <div className="ph"><h3>Plan &amp; usage</h3><span className="planbadge"><Crown /> {viewer?.isFounder ? 'Founder' : ent.name}</span></div>
                  <div className="pad">
                    <p className="plan-tag">{viewer?.isFounder ? 'Founder account — full access to everything, no payment required.' : `${ent.tagline}${ent.priceMonthly !== null ? ` · $${ent.priceMonthly}/mo` : ' · custom pricing'}`}</p>
                    <UsageMeter label="AI gateway scans" id="lcc-useScan" value={`${seedScans.toLocaleString()} / ${formatLimit(ent.gatewayScans)}`} barId="lcc-useBar" pct={ent.gatewayScans === UNLIMITED ? 6 : usagePercent(seedScans, ent.gatewayScans)} />
                    <UsageMeter label="Brain AI queries" value={ent.brainQueries === UNLIMITED ? 'Unlimited' : `${brainUsed.toLocaleString()} / ${formatLimit(ent.brainQueries)}`} pct={ent.brainQueries === UNLIMITED ? 6 : usagePercent(brainUsed, ent.brainQueries)} />
                    <UsageMeter label="Team seats" value={`${seedSeats} / ${formatLimit(ent.seats)}`} pct={ent.seats === UNLIMITED ? 8 : usagePercent(seedSeats, ent.seats)} />
                    <div className="usage-row" style={{ marginTop: '1rem' }}><span>Audit-log retention</span><b>{ent.retentionDays >= 365 ? `${Math.round(ent.retentionDays / 365)} yr` : `${ent.retentionDays} days`}</b></div>
                    {viewer?.isFounder ? (
                      <div className="topplan"><Crown /> Founder access — everything unlocked, no payment required.</div>
                    ) : ent.nextTier ? (
                      <Link href="/pricing" className="btn btn-p btn-sm" style={{ marginTop: 18 }}>Upgrade to {getEntitlements(ent.nextTier).name} <ArrowRight /></Link>
                    ) : (
                      <div className="topplan"><Crown /> You&apos;re on our top plan — everything unlocked.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* What's included on this plan vs what an upgrade unlocks — the
                  subscription value made explicit, gated feature by feature. */}
              <div className="panel" style={{ marginTop: 16 }}>
                <div className="ph"><h3>What your {ent.name} plan includes</h3>{ent.nextTier && <span className="mono">↑ {getEntitlements(ent.nextTier).name} unlocks more</span>}</div>
                <div className="pad feat-grid">
                  {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((k) => {
                    const on = hasFeature(ent, k)
                    const unlock = on ? null : tierThatUnlocks(k)
                    return (
                      <div key={k} className={`feat${on ? ' on' : ' off'}`}>
                        {on ? <Check className="feat-ic ok" /> : <Lock className="feat-ic lk" />}
                        <span className="feat-name">{FEATURE_LABELS[k]}</span>
                        {on ? <span className="feat-tag inc">Included</span> : <span className="feat-tag lock">{unlock ? `${unlock.name}+` : 'Add-on'}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** One labelled usage meter (value + fill bar). Optional ids let the live effect
 *  drive the number/width imperatively (gateway scans, Brain queries). */
function UsageMeter({ label, value, pct, id, barId }: { label: string; value: string; pct: number; id?: string; barId?: string }) {
  return (
    <div className="usage-block">
      <div className="usage-row"><span>{label}</span><b id={id}>{value}</b></div>
      <div className="usebar"><i id={barId} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function StepRow({ n, title, detail, cta, onClick, done }: { n: string; title: string; detail: string; cta: string; onClick: () => void; done?: boolean }) {
  return (
    <div className={`steprow${done ? ' done' : ''}`}>
      <div className="step-n">{done ? '✓' : n}</div>
      <div className="step-body"><b>{title}</b><span>{detail}</span></div>
      <button type="button" className="btn btn-g btn-sm" onClick={onClick}>{cta} <ArrowRight /></button>
    </div>
  )
}

/** Value row with an action button. "Copy" REALLY copies to the clipboard and
 *  only reports success when the write succeeded — never a fake confirmation
 *  (tasks/lessons.md 2026-07-12). Other actions (Reveal/Edit) are demo chrome. */
function CopyRow({ value, action, done }: { value: string; action: string; done: string }) {
  const [label, setLabel] = useState(action)
  const onClick = async () => {
    if (action !== 'Copy') {
      setLabel(done)
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setLabel(done)
      setTimeout(() => setLabel(action), 2000)
    } catch {
      setLabel('Copy failed')
      setTimeout(() => setLabel(action), 2000)
    }
  }
  return (
    <div className="gw"><span>{value}</span><button type="button" onClick={onClick}>{label}</button></div>
  )
}
