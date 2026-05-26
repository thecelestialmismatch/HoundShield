import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  AlertTriangle,
  Server,
  KeyRound,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Trust | Hound Shield",
  description:
    "Hound Shield's data egress boundary, detection pattern integrity, compliance roadmap (SOC 2, FIPS 140-3), and vulnerability disclosure program. Built for defense contractors who can't afford to be wrong.",
  alternates: { canonical: "https://houndshield.com/security" },
  openGraph: {
    title: "Security & Trust | Hound Shield",
    description:
      "What leaves your network, what doesn't, and how we prove it. Vulnerability disclosure, audit roadmap, and the SHA-256 integrity model behind every detection pattern.",
    url: "https://houndshield.com/security",
    type: "website",
  },
};

const dataEgress = [
  {
    leaves: "License key hash (HMAC-SHA-256 of customer ID)",
    purpose: "Subscription validation",
    storedBy: "Stripe + HoundShield API",
  },
  {
    leaves: "Scan count (integer per billing window)",
    purpose: "Metered billing",
    storedBy: "HoundShield API",
  },
  {
    leaves: "Detection pattern version hash",
    purpose: "Auto-update notifications",
    storedBy: "HoundShield API",
  },
  {
    leaves: "Anonymous error telemetry (opt-in)",
    purpose: "Reliability monitoring",
    storedBy: "Sentry (no PII)",
  },
];

const neverLeaves = [
  "Raw prompt content — scanned locally, never transmitted",
  "Detection match contents (CUI, PHI, PII strings)",
  "Audit log entries — written to customer-controlled storage",
  "Quarantined payloads — AES-256 encrypted at customer location",
  "Employee identifiers — log entries reference internal user IDs only",
  "AI provider responses — streamed back through proxy without copy",
];

const complianceRoadmap = [
  {
    framework: "SOC 2 Type II",
    status: "In progress",
    target: "Q4 2026",
    detail: "Drata-managed; controls implemented, observation window begins August 2026.",
  },
  {
    framework: "CMMC Level 2 (self-assessment)",
    status: "Internal validation complete",
    target: "Q3 2026 (C3PAO third-party)",
    detail: "All 110 NIST 800-171 Rev 2 controls mapped. Self-assessment SPRS score published with each release.",
  },
  {
    framework: "FIPS 140-3 cryptographic modules",
    status: "Planned",
    target: "Q1 2027",
    detail: "AES-256 quarantine encryption and SHA-256 audit chain to migrate to validated CMVP modules.",
  },
  {
    framework: "FedRAMP Moderate Equivalent",
    status: "Planned (post-SOC 2)",
    target: "Q2 2027",
    detail: "PreVeil-style equivalency path for non-Federal hosted offering. Self-hosted Docker mode already satisfies the boundary requirement.",
  },
  {
    framework: "HIPAA",
    status: "BAA available on Growth tier and above",
    target: "Available now",
    detail: "PHI detection covers all 18 HIPAA Safe Harbor identifiers. Quarantine encryption meets §164.312(a)(2)(iv).",
  },
  {
    framework: "ISO 27001",
    status: "Scoped",
    target: "Q2 2027",
    detail: "Following SOC 2 to share evidence base.",
  },
];

const patternIntegrity = [
  "Each release ships with a manifest of all 16 detection engines and their regex/ML pattern definitions.",
  "The manifest is SHA-256 hashed; the hash is published in the release notes and embedded in the container image label.",
  "Auditors can verify the patterns running in production match the published hash with a single shell command.",
  "Pattern updates require a signed release; customers opt in to updates per deployment.",
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security &amp; Trust
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Built for buyers who can&apos;t afford to be wrong.
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
            Hound Shield runs locally so prompt content never leaves your control boundary. This page
            documents what does leave, what never leaves, and the assurance model behind every claim.
            If you&apos;re a C3PAO assessor reviewing this product, start here.
          </p>
        </div>

        {/* TL;DR */}
        <section className="mb-16 border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-400 font-semibold mb-3">
            TL;DR
          </p>
          <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
            <li className="flex gap-3">
              <span className="text-brand-400 font-bold flex-shrink-0">·</span>
              <span>
                <strong className="text-white">In self-hosted Docker mode</strong>, prompt content never
                leaves your network. Only a license-key hash and scan count are transmitted (billing only).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-400 font-bold flex-shrink-0">·</span>
              <span>
                <strong className="text-white">In hosted trial mode</strong>, prompts terminate at
                proxy.houndshield.com — this mode is clearly labeled and is{" "}
                <strong className="text-white">not for CUI</strong>. CUI buyers must self-host.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-400 font-bold flex-shrink-0">·</span>
              <span>
                <strong className="text-white">SOC 2 Type II</strong> is in progress (Drata-managed, target
                Q4 2026). <strong className="text-white">FIPS 140-3 CMVP</strong> migration planned Q1 2027.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-brand-400 font-bold flex-shrink-0">·</span>
              <span>
                <strong className="text-white">Vulnerability disclosure:</strong>{" "}
                <a className="text-brand-400 underline hover:text-brand-300" href="mailto:security@houndshield.com">
                  security@houndshield.com
                </a>{" "}
                — 24h triage, 90-day disclosure window, safe-harbor for good-faith researchers.
              </span>
            </li>
          </ul>
        </section>

        {/* Data Egress Boundary */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Data egress boundary</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            DFARS 252.204-7012 and NIST 800-171 SC.3.177 require CUI to remain inside your authorization
            boundary. Hound Shield&apos;s self-hosted mode is designed to satisfy this requirement
            literally — the scan happens inside your network, the audit log is written to your storage,
            and only billing telemetry exits.
          </p>

          <div className="border border-white/[0.08] rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-emerald-500/[0.04]">
              <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                What leaves your network (self-hosted mode)
              </p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {dataEgress.map((row) => (
                <div key={row.leaves} className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-5 py-3.5 text-sm">
                  <div className="text-slate-200 font-medium">{row.leaves}</div>
                  <div className="text-slate-400">{row.purpose}</div>
                  <div className="text-slate-500 text-xs">{row.storedBy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-red-500/[0.04]">
              <p className="text-xs uppercase tracking-wider text-red-300 font-semibold">
                What never leaves
              </p>
            </div>
            <ul className="divide-y divide-white/[0.04]">
              {neverLeaves.map((item) => (
                <li key={item} className="px-5 py-3 text-sm text-slate-300 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-red-300/70 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500 mt-5">
            See <Link href="/deployment-modes" className="text-brand-400 underline hover:text-brand-300">
              deployment modes
            </Link>{" "}
            for the architectural diagram covering hosted trial, self-hosted Docker, and air-gapped modes.
          </p>
        </section>

        {/* Detection Pattern Integrity */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Detection pattern integrity</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Compliance evidence is only as good as the patterns that produced it. A C3PAO assessor needs
            to know the detection logic running in production matches what was tested.
          </p>
          <ul className="space-y-2.5 mb-5">
            {patternIntegrity.map((item) => (
              <li key={item} className="text-sm text-slate-300 flex items-start gap-3">
                <span className="text-brand-400 font-bold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <pre className="border border-white/[0.08] bg-black/40 rounded-xl p-4 text-xs font-mono text-brand-300 overflow-x-auto">
{`# Verify the running container matches the published pattern hash
docker inspect houndshield/proxy:latest \\
  --format '{{ index .Config.Labels "houndshield.pattern_hash" }}'

# Compare against the release manifest
curl https://houndshield.com/api/integrity/manifest | jq .pattern_hash`}
          </pre>
        </section>

        {/* Compliance Roadmap */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Compliance &amp; certifications</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Status as of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
            We refuse to claim certifications we haven&apos;t earned. If a vendor tells you they&apos;re
            SOC 2 certified, ask for the report.
          </p>
          <div className="border border-white/[0.08] rounded-2xl divide-y divide-white/[0.04]">
            {complianceRoadmap.map((row) => (
              <div key={row.framework} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-white">{row.framework}</h3>
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-white/[0.06] text-slate-300 self-start">
                    {row.target}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-wider text-brand-400 font-semibold mb-2">
                  {row.status}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vulnerability Disclosure */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Vulnerability disclosure</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            We welcome reports from security researchers acting in good faith. We will not pursue legal
            action against researchers who follow this policy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-white/[0.08] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Contact
              </p>
              <a
                href="mailto:security@houndshield.com"
                className="text-brand-400 hover:text-brand-300 text-sm font-medium"
              >
                security@houndshield.com
              </a>
              <p className="text-xs text-slate-500 mt-2">PGP key on request.</p>
            </div>
            <div className="border border-white/[0.08] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Response SLA
              </p>
              <p className="text-sm text-white font-medium">24h triage · 90d disclosure</p>
              <p className="text-xs text-slate-500 mt-2">CVSS ≥ 7.0 reports prioritized.</p>
            </div>
          </div>

          <div className="border border-white/[0.08] rounded-2xl p-5 mb-3">
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold mb-3">
              Safe harbor
            </p>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>· Test only on accounts you own or have explicit permission to access.</li>
              <li>· Do not access or exfiltrate customer data.</li>
              <li>· Do not perform DoS or social-engineering attacks.</li>
              <li>· Give us reasonable time to remediate before public disclosure.</li>
            </ul>
          </div>

          <div className="border border-white/[0.08] rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-red-300 font-semibold mb-3">
              Out of scope
            </p>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>· Rate-limit bypass on public marketing endpoints.</li>
              <li>· Missing security headers without a demonstrated exploit.</li>
              <li>· Self-XSS or attacks requiring physical access to a victim&apos;s machine.</li>
              <li>· Vulnerabilities in third-party services we do not control (Stripe, Supabase, Vercel).</li>
            </ul>
          </div>
        </section>

        {/* Key Management */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Cryptography &amp; key management</h2>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-brand-400 font-bold">·</span>
              <span><strong className="text-white">Data in transit:</strong> TLS 1.3 only. HSTS preload. No TLS 1.1/1.0.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-400 font-bold">·</span>
              <span><strong className="text-white">Quarantine at rest:</strong> AES-256-GCM. Keys never logged, rotated on customer request.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-400 font-bold">·</span>
              <span><strong className="text-white">Audit chain:</strong> SHA-256 hash-chained log. Each entry includes the prior hash. Tampering breaks the chain.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-400 font-bold">·</span>
              <span><strong className="text-white">Customer-managed encryption keys (BYOK):</strong> Enterprise tier — bring your own AWS KMS, Azure Key Vault, or HashiCorp Vault.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-400 font-bold">·</span>
              <span><strong className="text-white">License hash:</strong> HMAC-SHA-256(customer_id, server_secret). Never reversible to original key material.</span>
            </li>
          </ul>
        </section>

        {/* Footer CTA */}
        <section className="border border-brand-400/20 bg-brand-400/[0.04] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-2">Need to verify before you buy?</h2>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            We&apos;ll share our most recent dependency SBOM, our internal SPRS score, and a sample
            audit log with any qualified buyer or C3PAO assessor under mutual NDA. Two-business-day turnaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact?topic=security-review"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Request security packet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="mailto:security@houndshield.com"
              className="inline-flex items-center gap-2 border border-white/[0.1] text-slate-200 hover:bg-white/[0.04] font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Email security@ <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
