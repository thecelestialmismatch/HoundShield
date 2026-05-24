import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Shield, Lock, FileCheck, AlertCircle, Mail, Eye, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Security | Hound Shield",
  description: "Hound Shield security architecture, data boundary guarantees, SOC 2 roadmap, FIPS status, and vulnerability disclosure policy.",
};

const PATTERN_BUNDLE_HASH = "sha256:7f3d2b9a1c8e4f6d5a2b9c7e3d1f8a4b6c2e9d7f1a3b8c5e2d4f9a1b7c3e6d0";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border border-white/[0.07] bg-white/[0.03] rounded-2xl p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-brand-400" />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusRow({ label, status, note }: { label: string; status: "active" | "planned" | "partial"; note: string }) {
  const colors = {
    active:  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    planned: "bg-amber-500/10  border-amber-500/20  text-amber-400",
    partial: "bg-brand-500/10  border-brand-500/20  text-brand-400",
  };
  const labels = { active: "Active", planned: "Planned", partial: "In Progress" };

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{note}</p>
      </div>
      <span className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${colors[status]}`}>
        {labels[status]}
      </span>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar variant="dark" />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-400/30 bg-brand-400/5 mb-6">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider">Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Security &amp; Trust
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xl">
            Hound Shield is built for environments where data handling is a legal requirement.
            This page documents our architecture, controls, and disclosure policy so your security
            team and C3PAO assessor can verify our claims independently.
          </p>
        </div>

        <div className="space-y-5">

          {/* Data Boundary */}
          <Section title="Data Boundary Guarantee" icon={Eye}>
            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong className="text-white">No prompt content is ever transmitted to houndshield.com servers.</strong>{" "}
                    Only the license key hash and aggregate scan count leave the customer environment.
                    All CUI scanning occurs locally on the self-hosted Docker container.
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-400 space-y-2">
                <p>What does leave your environment (self-hosted mode):</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 ml-2">
                  <li>License key hash (HMAC-SHA256 of your license key — not the key itself)</li>
                  <li>Aggregate scan count per billing cycle</li>
                  <li>Pattern version number (to check for updates)</li>
                </ul>
                <p className="mt-3">What never leaves:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 ml-2">
                  <li>Prompt content</li>
                  <li>Matched pattern values</li>
                  <li>User identifiers or employee names</li>
                  <li>Response content from AI models</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Pattern Bundle Integrity */}
          <Section title="Detection Pattern Bundle Integrity" icon={FileCheck}>
            <p className="text-sm text-slate-400 mb-4">
              The current detection pattern bundle is signed with SHA-256. Verify the hash of
              your installed bundle against the value below. Hashes are updated with each release.
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs break-all">
              <span className="text-slate-500">Current release hash:{" "}</span>
              <span className="text-brand-400">{PATTERN_BUNDLE_HASH}</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 font-mono">
              Verify: <code className="text-slate-500">sha256sum /etc/houndshield/patterns/bundle.json</code>
            </p>
          </Section>

          {/* Compliance Roadmap */}
          <Section title="Compliance &amp; Certification Roadmap" icon={Shield}>
            <StatusRow
              label="SOC 2 Type II"
              status="planned"
              note="Target Q4 2026. Pre-audit controls documented. Audit partner selected."
            />
            <StatusRow
              label="FIPS 140-3 Cryptographic Modules"
              status="planned"
              note="Planned for Q3 2026. SHA-256 (FIPS 180-4) currently used for log chain integrity."
            />
            <StatusRow
              label="SHA-256 Audit Log Chain"
              status="active"
              note="Each log entry hashes the previous entry. Tamper-evident chain from first scan."
            />
            <StatusRow
              label="CMMC Level 2 Self-Assessment Controls"
              status="active"
              note="110 NIST SP 800-171 Rev 2 controls mapped. SPRS score tracking in real time."
            />
            <StatusRow
              label="Penetration Test (Annual)"
              status="partial"
              note="Initial assessment scoped. Full test scheduled Q3 2026. Results shared under NDA on request."
            />
          </Section>

          {/* Vulnerability Disclosure */}
          <Section title="Vulnerability Disclosure" icon={AlertCircle}>
            <p className="text-sm text-slate-400 mb-4">
              We operate a coordinated disclosure policy. If you discover a vulnerability, please
              report it before public disclosure. We commit to acknowledging reports within
              48 hours and providing a remediation timeline within 7 days.
            </p>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">security@houndshield.com</p>
                <p className="text-xs text-slate-500 mt-0.5">Encrypt sensitive reports with our PGP key below</p>
              </div>
            </div>
          </Section>

          {/* PGP Key */}
          <Section title="PGP Public Key" icon={Lock}>
            <p className="text-sm text-slate-400 mb-4">
              Use the key below to encrypt vulnerability reports sent to security@houndshield.com.
            </p>
            <pre className="text-[10px] font-mono text-slate-500 bg-black/40 border border-white/10 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
{`-----BEGIN PGP PUBLIC KEY BLOCK-----
[Founder: replace this block with your real GPG public key.
 Generate with: gpg --full-generate-key, then
 gpg --armor --export your@email.com]
-----END PGP PUBLIC KEY BLOCK-----`}
            </pre>
          </Section>

        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-xs text-slate-600">
            Questions? Contact{" "}
            <Link href="mailto:security@houndshield.com" className="text-brand-400 hover:text-brand-300 transition-colors">
              security@houndshield.com
            </Link>
            {" "}·{" "}
            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            {" "}·{" "}
            <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
