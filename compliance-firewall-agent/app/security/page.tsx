import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Server,
  Cloud,
  ShieldOff,
  Lock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";

export const metadata: Metadata = {
  title: "Security & Architecture — HoundShield",
  description:
    "HoundShield's three deployment modes, data-flow guarantees, Brain AI restrictions, and compliance posture. Written for security teams reviewing HoundShield before purchase.",
  alternates: { canonical: "https://houndshield.com/security" },
};

type DeploymentMode = {
  label: string;
  endpoint: string;
  icon: typeof Server;
  cuiSafe: boolean;
  fedrampAuthorized: boolean;
  audience: string;
  dataPath: string;
  notes: string[];
  color: string;
  border: string;
  bg: string;
};

const modes: DeploymentMode[] = [
  {
    label: "Mode A — Hosted Trial",
    endpoint: "proxy.houndshield.com (Vercel)",
    icon: Cloud,
    cuiSafe: false,
    fedrampAuthorized: false,
    audience: "Demo, non-CUI evaluation, internal pilots",
    dataPath: "Prompt → Vercel Edge → HoundShield scanner → upstream LLM",
    notes: [
      "Runs on Vercel. Vercel is NOT FedRAMP-authorized.",
      "Routing CUI, PHI, contract numbers, CAGE codes, or any DFARS 252.204-7012 covered data through this endpoint is a reportable spillage event.",
      "Use this endpoint only to evaluate detection accuracy with synthetic or non-sensitive data.",
    ],
    color: "text-amber-300",
    border: "border-amber-400/30",
    bg: "bg-amber-500/[0.05]",
  },
  {
    label: "Mode B — Self-Hosted Docker",
    endpoint: "houndshield/proxy:latest (customer infrastructure)",
    icon: Server,
    cuiSafe: true,
    fedrampAuthorized: false,
    audience: "CUI-handling DIB contractors, HIPAA covered entities, AmLaw 200 firms",
    dataPath:
      "Prompt → HoundShield Docker container inside customer network → upstream LLM (customer-selected; can be on-prem, Azure GovCloud, Azure OpenAI, or any OpenAI-compatible endpoint)",
    notes: [
      "Prompt content never leaves the customer's network boundary.",
      "Only the license-key hash and an aggregate scan counter are transmitted outbound (HTTPS to license.houndshield.com).",
      "Required for any CMMC Level 2, HIPAA, or attorney-client-privileged workload.",
      "FedRAMP Moderate eligibility depends on the customer's hosting environment, not on HoundShield.",
    ],
    color: "text-emerald-300",
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/[0.05]",
  },
  {
    label: "Mode C — Air-Gapped",
    endpoint: "Customer isolated network (no internet)",
    icon: ShieldOff,
    cuiSafe: true,
    fedrampAuthorized: false,
    audience: "Enterprise DIB, IL-5+ workloads, federal civilian high-side",
    dataPath:
      "Prompt → HoundShield container inside isolated network → customer-hosted LLM (no upstream egress)",
    notes: [
      "Fully offline operation. Zero outbound HTTPS traffic.",
      "License validated against a customer-hosted licensing server delivered with the image.",
      "Pattern updates and signed bundles delivered via removable media or customer-controlled artifact registry.",
      "Required for IL-5 and SAP environments.",
    ],
    color: "text-indigo-300",
    border: "border-indigo-400/30",
    bg: "bg-indigo-500/[0.05]",
  },
];

type ComplianceItem = {
  framework: string;
  status: "in-place" | "in-progress" | "planned";
  detail: string;
};

const compliance: ComplianceItem[] = [
  {
    framework: "NIST SP 800-171 Rev 2",
    status: "in-place",
    detail:
      "110-control coverage map shipped (lib/cmmc-coverage). 8 controls ENFORCED, 10 MONITORED, 25 PARTIAL when HoundShield is deployed in Mode B. See /command-center/shield/coverage.",
  },
  {
    framework: "SHA-256 hash-chained audit log",
    status: "in-place",
    detail:
      "Every scan event is appended to a tamper-evident log with the previous event's hash mixed in. Customer can verify chain integrity offline with the standalone verifier in proxy/audit-verify.",
  },
  {
    framework: "Detection patterns",
    status: "in-place",
    detail:
      "16 regex + heuristic engines for CUI (FOUO, CAGE codes, contract numbers, DD-254 references), PHI (18 HIPAA identifiers), PII, API keys, source code, financial data, IP, ITAR/EAR.",
  },
  {
    framework: "SOC 2 Type I",
    status: "in-progress",
    detail:
      "Engagement scheduled for Stage 2 (target start: July 2026). Report letter is the gating artifact for mid-market DIB procurement above $1,500/month.",
  },
  {
    framework: "FedRAMP Moderate (vendor)",
    status: "planned",
    detail:
      "Stage 3 work item. HoundShield is not currently a FedRAMP-authorized cloud service. Customers requiring FedRAMP coverage today should deploy Mode B inside their own FedRAMP-authorized boundary.",
  },
  {
    framework: "HIPAA BAA",
    status: "planned",
    detail:
      "Available on request for Mode B / Mode C deployments where HoundShield does not process PHI in our infrastructure. Mode A is excluded from BAA coverage.",
  },
];

const statusStyles: Record<ComplianceItem["status"], { label: string; classes: string; Icon: typeof CheckCircle2 }> = {
  "in-place": {
    label: "Shipped",
    classes: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
    Icon: CheckCircle2,
  },
  "in-progress": {
    label: "In progress",
    classes: "text-amber-300 border-amber-400/40 bg-amber-500/10",
    Icon: AlertTriangle,
  },
  planned: {
    label: "Planned",
    classes: "text-slate-300 border-slate-400/30 bg-slate-500/10",
    Icon: XCircle,
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <Navbar variant="dark" />

      {/* Hero */}
      <section className="px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
            Security &amp; Architecture
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            What leaves your network — and what doesn&rsquo;t.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
            This page is written for the security team reviewing HoundShield before purchase.
            It states our three deployment modes, the data path of each, where we are
            FedRAMP-authorized (we are not), and which compliance attestations are shipped
            versus in progress. No marketing language.
          </p>
          <p className="text-sm text-slate-500 mt-4 font-mono">
            Last updated: 2026-05-26 &nbsp;·&nbsp; Source: HoundShield engineering
          </p>
        </div>
      </section>

      {/* Deployment modes */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            Three deployment modes
          </h2>
          <p className="text-slate-400 mb-10 max-w-3xl">
            The HoundShield marketing site and dashboard run on Vercel. The CUI scanning data
            path does not. Pick the mode that matches the data you intend to route.
          </p>
          <div className="grid lg:grid-cols-3 gap-5">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.label}
                  className={`border ${mode.border} ${mode.bg} backdrop-blur-sm rounded-2xl p-6 flex flex-col`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${mode.bg} border ${mode.border} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${mode.color}`} />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                        mode.cuiSafe
                          ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/10"
                          : "text-amber-300 border-amber-400/40 bg-amber-500/10"
                      }`}
                    >
                      {mode.cuiSafe ? "CUI-safe" : "NOT CUI-safe"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1 leading-tight">
                    {mode.label}
                  </h3>
                  <code className={`block text-xs font-mono ${mode.color} mb-4 break-all`}>
                    {mode.endpoint}
                  </code>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                    Audience
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {mode.audience}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                    Data path
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4 font-mono text-[12px]">
                    {mode.dataPath}
                  </p>
                  <ul className="text-xs text-slate-400 leading-relaxed mt-auto pt-3 border-t border-white/[0.06] space-y-2">
                    {mode.notes.map((note, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brain AI restriction */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-400/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Brain AI is NOT a CUI-safe channel
              </h2>
              <p className="text-slate-400">
                The chat widget powered by &ldquo;Brain AI&rdquo; on this site is a separate
                service from the proxy.
              </p>
            </div>
          </div>
          <div className="border border-red-400/20 bg-red-500/[0.04] rounded-2xl p-6 space-y-4 text-slate-300 leading-relaxed">
            <p>
              Brain AI routes user messages through{" "}
              <strong className="text-white">OpenRouter</strong>, a commercial multi-LLM
              gateway. OpenRouter is{" "}
              <strong className="text-white">not FedRAMP-authorized</strong> and its upstream
              providers (Anthropic, OpenAI, Google) operate commercial endpoints that are
              outside the customer&rsquo;s control.
            </p>
            <p>
              Pasting Controlled Unclassified Information, PHI, contract numbers, CAGE codes,
              source code, API keys, or any sensitive data into Brain AI is a reportable
              spillage event under DFARS 252.204-7012 and NIST 800-171 SC.3.177.
            </p>
            <p>
              The chat widget displays an explicit consent gate on first open and a persistent
              red warning banner on every turn. Acknowledgement is stored in browser
              <code className="text-xs font-mono text-red-300 mx-1">localStorage</code> under
              key <code className="text-xs font-mono text-red-300">houndshield.brain-ai.cui-consent.v1</code>.
            </p>
            <p className="text-sm text-slate-400">
              For actual prompt scanning of sensitive data, deploy the HoundShield proxy in
              Mode B (Docker). The proxy scans locally and never sends prompt content to any
              third party.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance posture */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            Compliance posture (shipped vs. in progress)
          </h2>
          <p className="text-slate-400 mb-8 max-w-3xl">
            We list each framework with an explicit status. &ldquo;Shipped&rdquo; means the
            artifact is in the product or on disk. &ldquo;In progress&rdquo; means the work is
            funded and scheduled. &ldquo;Planned&rdquo; means it is on the Stage 3 roadmap and
            not yet started.
          </p>
          <div className="space-y-3">
            {compliance.map((item) => {
              const style = statusStyles[item.status];
              const Icon = style.Icon;
              return (
                <div
                  key={item.framework}
                  className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-5 flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-start gap-3 sm:w-64 flex-shrink-0">
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        item.status === "in-place"
                          ? "text-emerald-300"
                          : item.status === "in-progress"
                            ? "text-amber-300"
                            : "text-slate-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">
                        {item.framework}
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.classes}`}
                      >
                        {style.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed flex-1">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data boundary guarantee — Mode B */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Mode B data boundary — what we promise, what we don&rsquo;t
              </h2>
              <p className="text-slate-400">
                Verifiable claims about the self-hosted Docker deployment.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="border border-emerald-400/20 bg-emerald-500/[0.04] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">
                Stays inside your boundary
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>Prompt content (verbatim text the user typed)</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>Model responses</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>Detection patterns (loaded once at container start, no telemetry)</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>Audit log (SHA-256 chained, written to customer-provided volume)</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>User identity, IP addresses, request headers</span>
                </li>
              </ul>
            </div>
            <div className="border border-amber-400/20 bg-amber-500/[0.04] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-3">
                Crosses your boundary (HTTPS to license.houndshield.com)
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
                <li className="flex gap-2">
                  <FileCheck className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <span>License-key hash (SHA-256, irreversible)</span>
                </li>
                <li className="flex gap-2">
                  <FileCheck className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <span>Aggregate scan counter (integer, no per-scan detail)</span>
                </li>
                <li className="flex gap-2">
                  <FileCheck className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <span>Container version string (for upgrade notifications)</span>
                </li>
              </ul>
              <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-white/[0.06] leading-relaxed">
                Verify yourself: run <code className="text-amber-300 font-mono text-[11px]">tcpdump</code>{" "}
                during normal operation. The only outbound packets are TLS handshakes plus the
                three fields above, transmitted once per hour.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting + contact */}
      <section className="px-6 py-16 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-400/30 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-6 h-6 text-brand-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Report a vulnerability
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Email{" "}
            <a
              href="mailto:security@houndshield.com"
              className="text-brand-400 hover:text-brand-300 transition-colors"
            >
              security@houndshield.com
            </a>{" "}
            with reproduction steps and your contact information. We acknowledge within 24
            hours, triage within 72 hours, and disclose coordinated fixes through{" "}
            <Link
              href="/docs"
              className="text-brand-400 hover:text-brand-300 transition-colors"
            >
              the changelog
            </Link>
            .
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-400 transition-colors"
          >
            See pricing &amp; deployment options <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <TextLogo variant="dark" />
          </Link>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-white transition-colors cursor-pointer">About</Link>
            <Link href="/features" className="hover:text-white transition-colors cursor-pointer">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</Link>
            <Link href="/contact" className="hover:text-white transition-colors cursor-pointer">Contact</Link>
            <Link href="/docs" className="hover:text-white transition-colors cursor-pointer">Docs</Link>
            <Link href="/security" className="hover:text-white transition-colors cursor-pointer">Security</Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} HoundShield — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
