/**
 * ONE data model, three designs.
 *
 * Every field here maps to something the product already computes, so the demos
 * are a design comparison and not a feature fantasy:
 *   totals/blockRate/scanP50 → aggregateOverview() in lib/dashboard/overview-telemetry.ts
 *   providers/detections/hourly/recent → same
 *   sprs/controls/families → buildSprsPosture(ALL_CONTROLS, …) in lib/shieldready
 *   quarantine → GET /api/quarantine/review
 * Nothing below is a number the dashboard could not actually show.
 */

export const SECTIONS = [
  { id: 'realtime',   label: 'Real-Time Feed',    href: '/command-center/realtime' },
  { id: 'timeline',   label: 'Threat Timeline',   href: '/command-center/timeline' },
  { id: 'scanner',    label: 'Live Scanner',      href: '/command-center/scanner' },
  { id: 'events',     label: 'Audit Log',         href: '/command-center/events' },
  { id: 'quarantine', label: 'Quarantine',        href: '/command-center/quarantine' },
  { id: 'rules',      label: 'Firewall Rules',    href: '/command-center/rules' },
  { id: 'security',   label: 'Security Dashboard',href: '/command-center/security' },
  { id: 'sprs',       label: 'SPRS Dashboard',    href: '/command-center/sprs' },
  { id: 'assessment', label: 'Assessment',        href: '/command-center/assessment' },
  { id: 'coverage',   label: 'Coverage Map',      href: '/command-center/coverage' },
  { id: 'gaps',       label: 'Gap Analysis',      href: '/command-center/gaps' },
  { id: 'reports',    label: 'Reports',           href: '/command-center/reports' },
]

export const D = {
  operator: 'Sam',
  company: 'Meridian Defense Group',
  windowDays: 7,
  lastUpdate: '08:21',

  // ── Gateway ──────────────────────────────────────────────────────────────
  events: 4128,
  passed: 3901,
  held: 147,
  blocked: 80,
  blockRatePct: 1.9,
  scanP50Ms: 8,
  scanP99Ms: 23,
  gatewayUp: true,
  uptimePct: 99.97,

  // 24 hourly buckets: [total, blocked]
  hourly: [
    [41, 0], [28, 0], [19, 1], [12, 0], [9, 0], [14, 0],
    [38, 1], [96, 2], [184, 6], [231, 9], [252, 7], [238, 5],
    [196, 4], [214, 6], [263, 11], [271, 8], [244, 6], [198, 4],
    [141, 3], [96, 2], [71, 1], [58, 2], [49, 1], [44, 0],
  ],

  providers: [
    { name: 'OpenAI',    total: 1983, blocked: 41, held: 72 },
    { name: 'Copilot',   total: 1105, blocked: 22, held: 39 },
    { name: 'Anthropic', total: 662,  blocked: 11, held: 24 },
    { name: 'Gemini',    total: 378,  blocked: 6,  held: 12 },
  ],

  detections: [
    { name: 'CUI',   count: 58, control: 'SC.L2-3.13.16', trend: +12 },
    { name: 'PII',   count: 46, control: 'MP.L2-3.8.1',   trend: -4 },
    { name: 'ITAR',  count: 21, control: 'AC.L2-3.1.3',   trend: +7 },
    { name: 'PHI',   count: 14, control: 'MP.L2-3.8.2',   trend: 0 },
    { name: 'Source',count: 9,  control: 'AC.L2-3.1.1',   trend: -2 },
  ],

  recent: [
    { ref: 'evt_9f3a2c', t: '08:19', provider: 'OpenAI',    outcome: 'blocked', detected: 'CUI · ITAR', ms: 7,  risk: 'CRITICAL' },
    { ref: 'evt_7b1e04', t: '08:17', provider: 'Copilot',   outcome: 'held',    detected: 'PII',        ms: 9,  risk: 'MEDIUM' },
    { ref: 'evt_2d8c51', t: '08:16', provider: 'OpenAI',    outcome: 'passed',  detected: '',           ms: 6,  risk: 'LOW' },
    { ref: 'evt_44a9be', t: '08:14', provider: 'Anthropic', outcome: 'blocked', detected: 'CUI',        ms: 8,  risk: 'CRITICAL' },
    { ref: 'evt_c07f13', t: '08:12', provider: 'Gemini',    outcome: 'passed',  detected: '',           ms: 11, risk: 'LOW' },
    { ref: 'evt_5e6b88', t: '08:09', provider: 'Copilot',   outcome: 'held',    detected: 'PHI',        ms: 8,  risk: 'MEDIUM' },
  ],

  // ── CMMC posture ─────────────────────────────────────────────────────────
  sprs: 74,
  sprsTarget: 88,
  sprsPrev: 61,
  controlsMet: 82,
  controlsTotal: 110,
  gapsOpen: 28,
  gapsCritical: 6,
  quarantine: 147,
  lastReport: '2026-08-01',
  reportReady: true,

  families: [
    { code: 'AC', name: 'Access Control',        met: 18, total: 22 },
    { code: 'AU', name: 'Audit & Accountability',met: 9,  total: 9  },
    { code: 'CM', name: 'Configuration Mgmt',    met: 7,  total: 9  },
    { code: 'IA', name: 'Identification & Auth', met: 9,  total: 11 },
    { code: 'IR', name: 'Incident Response',     met: 2,  total: 3  },
    { code: 'MP', name: 'Media Protection',      met: 6,  total: 9  },
    { code: 'SC', name: 'System & Comms',        met: 12, total: 16 },
    { code: 'SI', name: 'System Integrity',      met: 5,  total: 7  },
  ],

  sprsHistory: [61, 63, 66, 66, 70, 72, 74],
}

/** Section summary rows — the "see everything, drill in" contract. */
export const ROWS = [
  { id:'realtime',  group:'Firewall', label:'Real-Time Feed',    value:'4,128',  unit:'prompts · 7d', state:'ok',   note:'Gateway live · 99.97% uptime', href:'/command-center/realtime' },
  { id:'events',    group:'Firewall', label:'Audit Log',         value:'4,128',  unit:'hash-chained', state:'ok',   note:'SHA-256 chain intact',         href:'/command-center/events' },
  { id:'timeline',  group:'Firewall', label:'Threat Timeline',   value:'80',     unit:'blocked · 7d', state:'warn', note:'1.9% of traffic stopped',      href:'/command-center/timeline' },
  { id:'quarantine',group:'Response', label:'Quarantine',        value:'147',    unit:'awaiting review', state:'act', note:'Oldest held 3d ago',        href:'/command-center/quarantine' },
  { id:'rules',     group:'Firewall', label:'Firewall Rules',    value:'16',     unit:'engines active', state:'ok',  note:'CUI · PHI · PII · IP · ITAR', href:'/command-center/rules' },
  { id:'scanner',   group:'Firewall', label:'Live Scanner',      value:'8ms',    unit:'p50 · 23ms p99', state:'ok',  note:'Scanned on your hardware',    href:'/command-center/scanner' },
  { id:'sprs',      group:'CMMC',     label:'SPRS Dashboard',    value:'74',     unit:'of 110 target 88', state:'warn', note:'+13 since 1 Jul',          href:'/command-center/sprs' },
  { id:'assessment',group:'CMMC',     label:'Assessment',        value:'82/110', unit:'controls met',  state:'warn', note:'75% complete',                href:'/command-center/assessment' },
  { id:'gaps',      group:'CMMC',     label:'Gap Analysis',      value:'28',     unit:'open · 6 critical', state:'act', note:'6 block conditional L2',  href:'/command-center/gaps' },
  { id:'coverage',  group:'CMMC',     label:'Coverage Map',      value:'8',      unit:'control families', state:'ok', note:'AU fully met',              href:'/command-center/coverage' },
  { id:'reports',   group:'CMMC',     label:'Reports',           value:'1 Aug',  unit:'last generated', state:'ok',  note:'C3PAO PDF ready',             href:'/command-center/reports' },
  { id:'security',  group:'Response', label:'Security Dashboard',value:'4',      unit:'providers seen', state:'ok',  note:'OpenAI leads at 48%',         href:'/command-center/security' },
]

export const fmt = (n) => n.toLocaleString('en-US')
