/**
 * Control Map — MSP portfolio compliance data model.
 *
 * Powers the multi-client "Control Map" dashboard (route: /control-map), the
 * surface an RPO/MSP partner uses to run CMMC posture across every client they
 * manage. This is HoundShield's #1 channel view (co-branded $499 report at
 * scale), so the numbers here are REAL aggregations of the sample portfolio —
 * not magic constants. Every top-line KPI the dashboard renders is computed by
 * a pure function in this file and asserted in
 * lib/dashboard/__tests__/control-map-data.test.ts.
 *
 * Control IDs and descriptions are accurate CMMC 2.0 Level 2 practices mapped
 * to NIST SP 800-171 Rev 2 requirements — the same authoritative framing as
 * lib/cmmc-coverage. Do not invent control IDs; extend from the real catalog.
 *
 * SAMPLE DATA ONLY. This is a demo/partner-preview portfolio, clearly scoped
 * to the dashboard — never surfaced as a marketing metric ("28 customers").
 */

export type ControlStatus = 'implemented' | 'in_progress' | 'not_started';

export type ClientSector = 'defense' | 'healthcare' | 'legal' | 'manufacturing';

/** A single CMMC L2 practice tracked across the portfolio. */
export interface MappedControl {
  /** CMMC L2 practice id, e.g. 'AC.L2-3.1.1'. */
  id: string;
  /** Two-letter NIST 800-171 family prefix, e.g. 'AC'. */
  family: string;
  /** Short human description of the practice. */
  description: string;
  status: ControlStatus;
  /** Implementation progress, 0–100. */
  progress: number;
  /** Count of evidence artifacts attached (audit-log exports, screenshots). */
  evidenceCount: number;
  /**
   * Flagged behind-schedule / high-impact. At-risk is a program judgement
   * (due date + SPRS weight + evidence gap), NOT merely "progress < N", so it
   * is stored explicitly rather than derived from progress.
   */
  atRisk: boolean;
}

/** A compliance framework the portfolio is being assessed against. */
export interface Framework {
  id: string;
  name: string;
  /** Optional maturity level label, e.g. 'Level 2'. */
  level?: string;
  /** Rollup progress across the framework, 0–100. */
  progress: number;
  /** The framework the org is actively driving toward (highlighted). */
  active: boolean;
  /** Total practices/controls in the framework. */
  controlCount: number;
}

/** One managed client in the MSP portfolio. */
export interface ClientRecord {
  id: string;
  name: string;
  sector: ClientSector;
  cmmcLevel: 1 | 2 | 3;
  /** Assessment completion for this client, 0–100. */
  progress: number;
  /** Open assessments in flight for this client. */
  assessmentsInProgress: number;
}

/** A fully-resolved view for a given scope (portfolio or one client). */
export interface DashboardSnapshot {
  /** 'all' for the whole portfolio, or a client id. */
  scope: 'all' | string;
  scopeLabel: string;
  overallProgress: number;
  cmmcLevelTarget: 1 | 2 | 3;
  /** Clients in scope: 28 for the portfolio, 1 for a single client. */
  activeClients: number;
  assessmentsInProgress: number;
  atRiskControls: number;
  frameworks: Framework[];
  controls: MappedControl[];
}

/* ── Portfolio control set (14 CMMC L2 practices) ─────────────────────────
 * First five deliberately mirror the canonical "Controls Mapped" preview:
 * AC.L2-3.1.1 · IA (MFA) · SI (monitor) · SC (boundary) · MP (media).
 * Progress values sum to 1008 → mean exactly 72 (the Overall Progress ring).
 * Exactly four controls carry atRisk=true (the At Risk KPI). */
export const PORTFOLIO_CONTROLS: readonly MappedControl[] = [
  {
    id: 'AC.L2-3.1.1',
    family: 'AC',
    description: 'Limit system access to authorized users',
    status: 'implemented',
    progress: 100,
    evidenceCount: 3,
    atRisk: false,
  },
  {
    id: 'IA.L2-3.5.3',
    family: 'IA',
    description: 'Multifactor authentication for local & network access',
    status: 'implemented',
    progress: 85,
    evidenceCount: 2,
    atRisk: false,
  },
  {
    id: 'SI.L2-3.14.6',
    family: 'SI',
    description: 'Monitor systems & traffic for attacks and indicators',
    status: 'in_progress',
    progress: 80,
    evidenceCount: 1,
    atRisk: false,
  },
  {
    id: 'SC.L2-3.13.5',
    family: 'SC',
    description: 'Boundary protection — subnetworks for public components',
    status: 'implemented',
    progress: 90,
    evidenceCount: 4,
    atRisk: false,
  },
  {
    id: 'MP.L2-3.8.3',
    family: 'MP',
    description: 'Media protection — sanitize media containing CUI',
    status: 'not_started',
    progress: 0,
    evidenceCount: 0,
    atRisk: true,
  },
  {
    id: 'AC.L2-3.1.2',
    family: 'AC',
    description: 'Limit access to permitted transactions & functions',
    status: 'implemented',
    progress: 95,
    evidenceCount: 2,
    atRisk: false,
  },
  {
    id: 'AU.L2-3.3.1',
    family: 'AU',
    description: 'Create & retain system audit logs for accountability',
    status: 'implemented',
    progress: 90,
    evidenceCount: 5,
    atRisk: false,
  },
  {
    id: 'CM.L2-3.4.1',
    family: 'CM',
    description: 'Establish & maintain baseline configurations',
    status: 'implemented',
    progress: 88,
    evidenceCount: 2,
    atRisk: false,
  },
  {
    id: 'SC.L2-3.13.1',
    family: 'SC',
    description: 'Monitor & control communications at system boundaries',
    status: 'in_progress',
    progress: 75,
    evidenceCount: 2,
    atRisk: false,
  },
  {
    id: 'AU.L2-3.3.5',
    family: 'AU',
    description: 'Correlate audit review & analysis for investigation',
    status: 'in_progress',
    progress: 70,
    evidenceCount: 1,
    atRisk: false,
  },
  {
    id: 'AT.L2-3.2.1',
    family: 'AT',
    description: 'Train personnel on security risks & responsibilities',
    status: 'in_progress',
    progress: 65,
    evidenceCount: 1,
    atRisk: false,
  },
  {
    id: 'IR.L2-3.6.1',
    family: 'IR',
    description: 'Establish an operational incident-handling capability',
    status: 'in_progress',
    progress: 60,
    evidenceCount: 1,
    atRisk: true,
  },
  {
    id: 'RA.L2-3.11.2',
    family: 'RA',
    description: 'Scan for vulnerabilities in systems & applications',
    status: 'in_progress',
    progress: 55,
    evidenceCount: 1,
    atRisk: true,
  },
  {
    id: 'PS.L2-3.9.2',
    family: 'PS',
    description: 'Protect CUI during & after personnel actions',
    status: 'in_progress',
    progress: 55,
    evidenceCount: 0,
    atRisk: true,
  },
];

/* ── Frameworks ───────────────────────────────────────────────────────── */
export const FRAMEWORKS: readonly Framework[] = [
  { id: 'cmmc-2', name: 'CMMC 2.0', level: 'Level 2', progress: 72, active: true, controlCount: 110 },
  { id: 'nist-800-171', name: 'NIST SP 800-171', progress: 58, active: false, controlCount: 110 },
  { id: 'nist-800-172', name: 'NIST SP 800-172', progress: 55, active: false, controlCount: 35 },
  { id: 'cis-v8', name: 'CIS Controls v8', progress: 41, active: false, controlCount: 153 },
];

/* ── Managed clients (28) ──────────────────────────────────────────────
 * assessmentsInProgress across all 28 sums to exactly 36 (the Assessments
 * KPI): the first 8 clients carry 2 open assessments, the remaining 20 carry
 * 1 → 8·2 + 20·1 = 36. Guarded by the data test. */
const CLIENT_SEED: ReadonlyArray<[string, ClientSector, 1 | 2 | 3, number]> = [
  ['Aegis Defense Systems', 'defense', 2, 88],
  ['Meridian Health Partners', 'healthcare', 2, 81],
  ['Calloway & Reed LLP', 'legal', 2, 76],
  ['Ironclad Manufacturing', 'manufacturing', 2, 74],
  ['Northwind Aerospace', 'defense', 3, 69],
  ['Sentinel Medical Group', 'healthcare', 2, 84],
  ['Blackstone Legal Advisors', 'legal', 2, 71],
  ['Precision Tooling Co.', 'manufacturing', 2, 63],
  ['Vanguard Munitions', 'defense', 2, 79],
  ['Harborview Clinics', 'healthcare', 2, 66],
  ['Sterling Counsel Group', 'legal', 2, 58],
  ['Apex Fabrication', 'manufacturing', 2, 72],
  ['Redstone Robotics', 'defense', 2, 91],
  ['Cascade Family Practice', 'healthcare', 1, 61],
  ['Whitmore & Associates', 'legal', 2, 68],
  ['Titan Composites', 'manufacturing', 2, 77],
  ['Falcon Guidance Labs', 'defense', 3, 74],
  ['Bayside Radiology', 'healthcare', 2, 55],
  ['Pinnacle Litigation', 'legal', 2, 82],
  ['Foundry Metalworks', 'manufacturing', 2, 64],
  ['Guardian Optics', 'defense', 2, 70],
  ['Summit Care Network', 'healthcare', 2, 73],
  ['Draper & Hall Law', 'legal', 2, 59],
  ['Kestrel Machining', 'manufacturing', 2, 67],
  ['Anvil Systems Group', 'defense', 2, 85],
  ['Lakeshore Physicians', 'healthcare', 2, 62],
  ['Corbin Legal Partners', 'legal', 2, 78],
  ['Delta Precision Parts', 'manufacturing', 2, 71],
];

export const CLIENTS: readonly ClientRecord[] = CLIENT_SEED.map(
  ([name, sector, cmmcLevel, progress], i) => ({
    id: `client-${String(i + 1).padStart(2, '0')}`,
    name,
    sector,
    cmmcLevel,
    progress,
    assessmentsInProgress: i < 8 ? 2 : 1,
  }),
);

/* ── Pure aggregation helpers (all unit-tested) ───────────────────────── */

/** Portfolio-wide CMMC Level target — the highest level any client pursues
 *  that the majority is driving toward. Sample portfolio targets Level 2. */
export const CMMC_LEVEL_TARGET: 1 | 2 | 3 = 2;

/** Mean implementation progress across a control set, rounded to an integer. */
export function computeOverallProgress(controls: readonly MappedControl[]): number {
  if (controls.length === 0) return 0;
  const sum = controls.reduce((acc, c) => acc + c.progress, 0);
  return Math.round(sum / controls.length);
}

/** Number of controls flagged at-risk. */
export function countAtRiskControls(controls: readonly MappedControl[]): number {
  return controls.filter((c) => c.atRisk).length;
}

/** Distribution of controls by status. */
export function countByStatus(
  controls: readonly MappedControl[],
): Record<ControlStatus, number> {
  return controls.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { implemented: 0, in_progress: 0, not_started: 0 } as Record<ControlStatus, number>,
  );
}

/** Total open assessments across a set of clients. */
export function countAssessmentsInProgress(clients: readonly ClientRecord[]): number {
  return clients.reduce((acc, c) => acc + c.assessmentsInProgress, 0);
}

/** Total evidence artifacts attached across a control set. */
export function countEvidence(controls: readonly MappedControl[]): number {
  return controls.reduce((acc, c) => acc + c.evidenceCount, 0);
}

export function getClientById(id: string): ClientRecord | undefined {
  return CLIENTS.find((c) => c.id === id);
}

export function getFrameworkById(id: string): Framework | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}

/* ── Deterministic per-client transform ───────────────────────────────
 * A single client's posture is the portfolio baseline nudged by a seeded
 * factor derived from the client's own progress, so each client view is
 * distinct, reproducible, and bounded to [0, 100]. No randomness at render
 * time (SSR-safe, test-stable). */

/** Stable 32-bit hash of a string (FNV-1a). */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Project the portfolio controls onto a single client's posture. */
export function getClientControls(client: ClientRecord): MappedControl[] {
  // Bias every control toward the client's own completion level, with a small
  // deterministic per-control jitter so the mix stays realistic.
  const bias = (client.progress - 72) * 0.6;
  return PORTFOLIO_CONTROLS.map((c) => {
    const jitter = (hashString(client.id + c.id) % 21) - 10; // −10..+10
    const progress = c.progress === 0 ? clamp(Math.round(bias + jitter + 20), 0, 100)
      : clamp(Math.round(c.progress + bias + jitter));
    const status: ControlStatus =
      progress >= 100 ? 'implemented'
      : progress <= 0 ? 'not_started'
      : progress >= 90 ? 'implemented'
      : 'in_progress';
    return {
      ...c,
      progress,
      status,
      // A control is at-risk for a client if it was a portfolio risk AND the
      // client hasn't pushed it past the safety line.
      atRisk: c.atRisk && progress < 75,
    };
  });
}

/**
 * Resolve a full snapshot for a scope. 'all' returns the portfolio rollup;
 * a client id returns that client's projected posture. Unknown scopes fall
 * back to the portfolio.
 */
export function getSnapshot(scope: 'all' | string = 'all'): DashboardSnapshot {
  if (scope === 'all') {
    return {
      scope: 'all',
      scopeLabel: 'All Clients',
      overallProgress: computeOverallProgress(PORTFOLIO_CONTROLS),
      cmmcLevelTarget: CMMC_LEVEL_TARGET,
      activeClients: CLIENTS.length,
      assessmentsInProgress: countAssessmentsInProgress(CLIENTS),
      atRiskControls: countAtRiskControls(PORTFOLIO_CONTROLS),
      frameworks: FRAMEWORKS.map((f) => ({ ...f })),
      controls: PORTFOLIO_CONTROLS.map((c) => ({ ...c })),
    };
  }

  const client = getClientById(scope);
  if (!client) return getSnapshot('all');

  const controls = getClientControls(client);
  const factor = client.progress / 72;
  return {
    scope: client.id,
    scopeLabel: client.name,
    overallProgress: client.progress,
    cmmcLevelTarget: client.cmmcLevel,
    activeClients: 1,
    assessmentsInProgress: client.assessmentsInProgress,
    atRiskControls: countAtRiskControls(controls),
    frameworks: FRAMEWORKS.map((f) => ({
      ...f,
      progress: clamp(Math.round(f.progress * factor)),
    })),
    controls,
  };
}

/* ── View-model presentation helpers ──────────────────────────────────── */

export const STATUS_LABEL: Record<ControlStatus, string> = {
  implemented: 'Implemented',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

export const SECTOR_LABEL: Record<ClientSector, string> = {
  defense: 'Defense',
  healthcare: 'Healthcare',
  legal: 'Legal',
  manufacturing: 'Manufacturing',
};
