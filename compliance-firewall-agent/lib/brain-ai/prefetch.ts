/**
 * Brain AI — Prefetch & Project Scan
 *
 * Pre-loads compliance data, scans project structure, and warms caches
 * before the first user interaction. Brain AI original implementation for Hound Shield.
 */

export interface PrefetchEntry {
  key: string;
  value: unknown;
  fetchedAt: number;
  ttlMs: number;
  source: "memory" | "filesystem" | "api" | "env";
}

export interface ProjectScanResult {
  rootPath: string;
  fileCount: number;
  hasNextConfig: boolean;
  hasEnvFile: boolean;
  hasSupabaseSchema: boolean;
  hasComplianceData: boolean;
  hasTestSuite: boolean;
  detectedFramework: "nextjs" | "vite" | "remix" | "unknown";
  detectedLanguages: string[];
  entryPoints: string[];
  scannedAt: number;
}

export interface KeychainEntry {
  name: string;
  present: boolean;
  maskedValue: string;
  requiredFor: string;
}

export interface PrefetchReport {
  entries: PrefetchEntry[];
  projectScan: ProjectScanResult;
  keychain: KeychainEntry[];
  warmupDurationMs: number;
  ready: boolean;
}

// ─── In-memory prefetch cache ────────────────────────────────────────────────

const _cache = new Map<string, PrefetchEntry>();

export function cacheSet(key: string, value: unknown, ttlMs = 60_000, source: PrefetchEntry["source"] = "memory"): void {
  _cache.set(key, { key, value, fetchedAt: Date.now(), ttlMs, source });
}

export function cacheGet<T = unknown>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) {
    _cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheClear(): void {
  _cache.clear();
}

export function getCacheSnapshot(): PrefetchEntry[] {
  return Array.from(_cache.values());
}

// ─── Keychain prefetch ────────────────────────────────────────────────────────

const KEYCHAIN_DEFS: Array<{ name: string; envVar: string; requiredFor: string }> = [
  { name: "Supabase URL",        envVar: "NEXT_PUBLIC_SUPABASE_URL",       requiredFor: "database & auth" },
  { name: "Supabase Anon Key",   envVar: "NEXT_PUBLIC_SUPABASE_ANON_KEY",  requiredFor: "database & auth" },
  { name: "OpenRouter API Key",  envVar: "OPENROUTER_API_KEY",             requiredFor: "LLM calls" },
  { name: "Stripe Secret Key",   envVar: "STRIPE_SECRET_KEY",              requiredFor: "billing" },
  { name: "Stripe Webhook Secret", envVar: "STRIPE_WEBHOOK_SECRET",        requiredFor: "billing webhooks" },
  { name: "Resend API Key",      envVar: "RESEND_API_KEY",                 requiredFor: "transactional email" },
  { name: "PostHog Key",         envVar: "NEXT_PUBLIC_POSTHOG_KEY",        requiredFor: "analytics" },
  { name: "Sentry DSN",          envVar: "NEXT_PUBLIC_SENTRY_DSN",         requiredFor: "error tracking" },
  { name: "Brain AI Model",      envVar: "BRAIN_AI_MODEL",                 requiredFor: "LLM routing" },
];

export function keychainPrefetch(): KeychainEntry[] {
  return KEYCHAIN_DEFS.map(({ name, envVar, requiredFor }) => {
    const raw = process.env[envVar] ?? "";
    const present = raw.length > 0;
    const maskedValue = present
      ? raw.substring(0, 4) + "****" + raw.substring(raw.length - 2)
      : "(not set)";
    return { name, present, maskedValue, requiredFor };
  });
}

// ─── Project scan ─────────────────────────────────────────────────────────────

export function mdmRawRead(key: string): string | null {
  // Reads a raw metadata value from the Brain AI MDM store (env-backed).
  return process.env[`BRAIN_MDM_${key.toUpperCase()}`] ?? null;
}

export function projectScan(rootPath = "."): ProjectScanResult {
  // In server environments, attempt a lightweight FS check.
  let hasNextConfig = false;
  let hasEnvFile = false;
  let hasSupabaseSchema = false;
  let hasComplianceData = false;
  let hasTestSuite = false;
  let fileCount = 0;

  try {
    if (typeof require !== "undefined") {
      const fs = require("fs") as typeof import("fs");
      const path = require("path") as typeof import("path");

      const check = (rel: string) => {
        try { return fs.existsSync(path.join(rootPath, rel)); } catch { return false; }
      };

      hasNextConfig    = check("next.config.js") || check("next.config.ts");
      hasEnvFile       = check(".env") || check(".env.local");
      hasSupabaseSchema = check("supabase/schema.sql") || check("supabase/migrations");
      hasComplianceData = check("reference-data") || check("compliance-data");
      hasTestSuite     = check("__tests__") || check("tests") || check("spec");

      try {
        const walk = (dir: string, depth = 0): number => {
          if (depth > 3) return 0;
          let count = 0;
          for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(".") || f === "node_modules") continue;
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) count += walk(full, depth + 1);
            else count++;
          }
          return count;
        };
        fileCount = walk(rootPath);
      } catch { /* ignore */ }
    }
  } catch { /* non-Node environment */ }

  return {
    rootPath,
    fileCount,
    hasNextConfig,
    hasEnvFile,
    hasSupabaseSchema,
    hasComplianceData,
    hasTestSuite,
    detectedFramework: hasNextConfig ? "nextjs" : "unknown",
    detectedLanguages: ["TypeScript", "TSX", "CSS"],
    entryPoints: ["app/page.tsx", "app/layout.tsx", "app/api/brain-ai/execute/route.ts"],
    scannedAt: Date.now(),
  };
}

// ─── Full prefetch warmup ─────────────────────────────────────────────────────

export async function runPrefetch(rootPath = "."): Promise<PrefetchReport> {
  const start = Date.now();

  const keychain = keychainPrefetch();
  const projectScanResult = projectScan(rootPath);

  // Warm the keychain into cache
  cacheSet("keychain", keychain, 300_000, "env");
  cacheSet("project_scan", projectScanResult, 120_000, "filesystem");

  const entries = getCacheSnapshot();
  const warmupDurationMs = Date.now() - start;

  const coreKeysPresent = keychain
    .filter((k) => ["Supabase URL", "OpenRouter API Key"].includes(k.name))
    .every((k) => k.present);

  return {
    entries,
    projectScan: projectScanResult,
    keychain,
    warmupDurationMs,
    ready: coreKeysPresent,
  };
}

export function renderPrefetchReport(report: PrefetchReport): string {
  const lines = [
    `## Brain AI Prefetch Report`,
    `**Warmup:** ${report.warmupDurationMs}ms · **Ready:** ${report.ready ? "✅" : "⚠️"}`,
    "",
    "### Keychain",
  ];
  for (const k of report.keychain) {
    lines.push(`- ${k.present ? "✅" : "❌"} **${k.name}** — ${k.requiredFor} (${k.maskedValue})`);
  }
  lines.push("", "### Project Scan");
  const s = report.projectScan;
  lines.push(`- Framework: **${s.detectedFramework}**`);
  lines.push(`- Files: ${s.fileCount}`);
  lines.push(`- Next config: ${s.hasNextConfig ? "✅" : "❌"}`);
  lines.push(`- Env file: ${s.hasEnvFile ? "✅" : "❌"}`);
  lines.push(`- Tests: ${s.hasTestSuite ? "✅" : "❌"}`);
  return lines.join("\n");
}
