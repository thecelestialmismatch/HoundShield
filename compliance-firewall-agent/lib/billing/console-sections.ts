/**
 * Console capability sections — turns a signed-in user's plan into the
 * "restricted (free) vs. everything (paid)" grid the after-login `/console`
 * dashboard renders.
 *
 * It is a thin, pure projection over `lib/billing/entitlements.ts` (the single
 * source of truth for what each plan includes). It never re-defines what a tier
 * gets — it only decides, per capability: is it unlocked (link into the app) or
 * locked (show a padlock + a truthful "Available on <tier>" + one Upgrade CTA)?
 *
 * Every locked/upgrade CTA points at `/pricing`, which leads with the live
 * $499 CMMC AI Risk Assessment Report — so a free user's upgrade path funnels
 * to the product we can actually fulfil today, not a not-yet-purchasable SKU.
 *
 * Pure and fully unit-tested so the dashboard, pricing page, and any future
 * server-side enforcement stay in lockstep.
 */

import {
  type FeatureKey,
  type TierSlug,
  FEATURE_LABELS,
  getEntitlements,
  hasFeature,
  normalizeTier,
  tierThatUnlocks,
} from './entitlements';

/** Where every upgrade/unlock CTA sends the user. /pricing leads with the $499 report. */
export const CONSOLE_UPGRADE_HREF = '/pricing';

/** In-app destination + one-line blurb for each gated capability. */
interface FeatureMeta {
  /** Command-center route this capability lives at (used when unlocked). */
  href: string;
  /** One-line, plain-English value statement shown on the tile. */
  description: string;
}

/**
 * Order = how capabilities read on the dashboard (roughly the buyer's journey:
 * detect → alert → evidence → govern → deploy). Hrefs point at real
 * command-center routes and are used only when a capability is unlocked; locked
 * tiles ignore this href and drive the /pricing upgrade instead.
 */
const FEATURE_META: Record<FeatureKey, FeatureMeta> = {
  aiGateway: {
    href: '/command-center/realtime',
    description: 'Scan every AI prompt locally in <10ms across 16 CUI/PHI/PII engines.',
  },
  slackAlerts: {
    href: '/command-center/rules',
    description: 'Get emailed and Slacked the moment a prompt is blocked.',
  },
  apiAccess: {
    href: '/command-center/sdk',
    description: 'Wire the gateway into your stack and pull JSON evidence via API.',
  },
  auditExport: {
    href: '/command-center/audit-export',
    description: 'Export the SHA-256 hash-chained audit trail for your assessor.',
  },
  pdfReports: {
    href: '/command-center/shield/reports',
    description: 'Generate the C3PAO-ready PDF mapped to NIST 800-171 Rev 2.',
  },
  c3paoCoordination: {
    href: '/command-center/shield/reports',
    description: 'Hand your assessor a package built to the evidence format they expect.',
  },
  ssoRbac: {
    href: '/command-center/team',
    description: 'SSO sign-in and role-based access for your whole team.',
  },
  hitlQuarantine: {
    href: '/command-center/quarantine',
    description: 'Hold risky prompts for human review before they ever leave.',
  },
  onPrem: {
    href: '/command-center/settings',
    description: 'Run fully on-prem or air-gapped inside your own boundary (Mode B/C).',
  },
  whiteLabel: {
    href: '/command-center/shield/reports',
    description: 'Co-brand reports for your clients as an RPO or MSP.',
  },
  prioritySupport: {
    href: '/command-center/chat',
    description: 'Priority support and a dedicated customer success manager.',
  },
};

/** A capability the current plan includes — links straight into the app. */
export interface ConsoleTile {
  key: FeatureKey;
  label: string;
  description: string;
  href: string;
}

/** A capability the current plan does NOT include — locked, with an upgrade path. */
export interface LockedConsoleTile extends ConsoleTile {
  /** Lowest tier that unlocks this capability (for a truthful "Available on X"). */
  availableOnTier: TierSlug;
  /** Human name of that tier ("Pro", "Growth", …). */
  availableOnName: string;
  /** Where the Upgrade CTA sends them (always /pricing → $499 report first). */
  upgradeHref: string;
}

export interface ConsoleSections {
  tier: TierSlug;
  planName: string;
  /** False only for the Free plan — drives the "restricted dashboard" treatment. */
  isPaid: boolean;
  /** Capabilities this plan includes, in product order. */
  unlocked: ConsoleTile[];
  /** Capabilities this plan lacks, each with a truthful upgrade target. */
  locked: LockedConsoleTile[];
  /** Single upgrade destination for the dashboard-level CTA. */
  upgradeHref: string;
}

/** The capability order shown on the dashboard. */
const FEATURE_ORDER: FeatureKey[] = [
  'aiGateway',
  'slackAlerts',
  'auditExport',
  'apiAccess',
  'pdfReports',
  'c3paoCoordination',
  'ssoRbac',
  'hitlQuarantine',
  'onPrem',
  'whiteLabel',
  'prioritySupport',
];

/**
 * Project a plan onto the console's unlocked/locked capability grid.
 *
 * @param tier Any tier slug/alias (case-insensitive); unknown → Free.
 */
export function buildConsoleSections(tier: string | null | undefined): ConsoleSections {
  const ent = getEntitlements(tier);
  const slug = normalizeTier(tier);

  const unlocked: ConsoleTile[] = [];
  const locked: LockedConsoleTile[] = [];

  for (const key of FEATURE_ORDER) {
    const meta = FEATURE_META[key];
    const tile: ConsoleTile = {
      key,
      label: FEATURE_LABELS[key],
      description: meta.description,
      href: meta.href,
    };

    if (hasFeature(ent, key)) {
      unlocked.push(tile);
      continue;
    }

    const unlocks = tierThatUnlocks(key);
    locked.push({
      ...tile,
      // Locked tiles never deep-link into a page the user can't use — the whole
      // tile drives the upgrade instead.
      href: CONSOLE_UPGRADE_HREF,
      availableOnTier: unlocks?.tier ?? 'enterprise',
      availableOnName: unlocks?.name ?? 'Enterprise',
      upgradeHref: CONSOLE_UPGRADE_HREF,
    });
  }

  return {
    tier: slug,
    planName: ent.name,
    isPaid: slug !== 'free',
    unlocked,
    locked,
    upgradeHref: CONSOLE_UPGRADE_HREF,
  };
}
