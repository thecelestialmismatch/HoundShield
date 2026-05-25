import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import {
  Cloud,
  Server,
  ShieldOff,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Terminal,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deployment Modes | Hound Shield",
  description:
    "Hosted trial, self-hosted Docker, and air-gapped deployment modes for Hound Shield. Which one satisfies DFARS 7012 SC.3.177 for CUI? When do you need self-hosted? Read before you deploy.",
  alternates: { canonical: "https://houndshield.com/deployment-modes" },
  openGraph: {
    title: "Deployment Modes | Hound Shield",
    description:
      "Three deployment modes — hosted trial, self-hosted Docker, air-gapped — with the compliance matrix that tells you which one satisfies CMMC, DFARS, and HIPAA for your environment.",
    url: "https://houndshield.com/deployment-modes",
    type: "website",
  },
};

interface ModeRow {
  id: "hosted" | "docker" | "airgapped";
  name: string;
  icon: typeof Cloud;
  iconColor: string;
  iconBg: string;
  tagline: string;
  setupTime: string;
  cuiSafe: boolean;
  phiSafe: boolean;
  airgapSafe: boolean;
  endpoint: string;
  trade: string;
  bestFor: string;
  setupCmd?: string;
}

const modes: ModeRow[] = [
  {
    id: "hosted",
    name: "Hosted trial",
    icon: Cloud,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tagline: "60-second start — for non-CUI evaluation only.",
    setupTime: "60 seconds",
    cuiSafe: false,
    phiSafe: false,
    airgapSafe: false,
    endpoint: "https://proxy.houndshield.com/v1",
    trade:
      "Prompts terminate at our hosted endpoint. This mode IS NOT suitable for Controlled Unclassified Information (CUI) or Protected Health Information (PHI) — those buyers must self-host. Use this mode only to evaluate the product on non-sensitive workloads.",
    bestFor:
      "Free trial users, product evaluation, developers building demos, non-regulated startups, environments where no CUI/PHI/PII ever touches the model.",
  },
  {
    id: "docker",
    name: "Self-hosted Docker",
    icon: Server,
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    tagline: "10-minute setup — required for CUI, recommended for PHI.",
    setupTime: "~10 minutes",
    cuiSafe: true,
    phiSafe: true,
    airgapSafe: false,
    endpoint: "http://localhost:8080/v1 (or your internal hostname)",
    trade:
      "You operate the container. You own the audit log storage. You control the egress firewall. Only the license-key hash and scan count reach houndshield.com (billing only). All prompt content stays inside your authorization boundary — satisfies DFARS 252.204-7012 and NIST 800-171 SC.3.177.",
    bestFor:
      "All CMMC Level 2 customers, HIPAA-regulated environments, financial services with NYDFS/PCI exposure, any team where 'data sovereignty' is a contract requirement.",
    setupCmd: `docker run -d --name houndshield \\
  -p 8080:8080 \\
  -e HOUNDSHIELD_LICENSE_KEY=$LICENSE \\
  -e OPENAI_API_KEY=$OPENAI_API_KEY \\
  -v ./audit-logs:/var/lib/houndshield/audit \\
  houndshield/proxy:latest`,
  },
  {
    id: "airgapped",
    name: "Air-gapped",
    icon: ShieldOff,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tagline: "Classified / IL-5+ / SCIFs — contact sales.",
    setupTime: "Custom engagement",
    cuiSafe: true,
    phiSafe: true,
    airgapSafe: true,
    endpoint: "Customer-provided on-prem hostname",
    trade:
      "Zero outbound network access. License validation switches to offline hardware token. Pattern updates delivered via signed media. Audit logs written to customer-managed write-once storage. Enterprise tier only.",
    bestFor:
      "Defense primes operating SCIFs, IL-5/IL-6 environments, classified contract work, intelligence community vendors, customers with sovereign-cloud or data-diode requirements.",
  },
];

const yesNo = (v: boolean) =>
  v ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-400">
      <Check className="w-4 h-4" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-red-400">
      <X className="w-4 h-4" />
      No
    </span>
  );

export default function DeploymentModesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <div className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-5">
            <Server className="w-3.5 h-3.5" />
            Deployment Modes
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Three ways to deploy. One satisfies your CMMC boundary.
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            &quot;Local-only&quot; means your prompt content stays inside your authorization boundary.
            That&apos;s true in self-hosted Docker and air-gapped modes. The hosted trial is a paid
            convenience for non-sensitive workloads — do not point CUI at it. Pick the mode that
            matches your data classification before you sign a SaaS order form.
          </p>
        </div>

        {/* Compliance Matrix */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">Compliance matrix</h2>
          <div className="overflow-x-auto border border-white/[0.08] rounded-2xl">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left text-xs uppercase tracking-wider text-slate-500 font-semibold px-5 py-3.5">
                    Capability
                  </th>
                  {modes.map((m) => (
                    <th
                      key={m.id}
                      className="text-left text-xs uppercase tracking-wider text-slate-300 font-semibold px-5 py-3.5"
                    >
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="px-5 py-3.5 text-sm text-slate-300">Setup time</td>
                  {modes.map((m) => (
                    <td key={m.id} className="px-5 py-3.5 text-sm text-white font-medium">
                      {m.setupTime}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-sm text-slate-300">
                    Satisfies <strong className="text-white">DFARS 7012 / SC.3.177</strong> (CUI)
                  </td>
                  {modes.map((m) => (
                    <td key={m.id} className="px-5 py-3.5 text-sm">
                      {yesNo(m.cuiSafe)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-sm text-slate-300">
                    Suitable for <strong className="text-white">HIPAA PHI</strong>
                  </td>
                  {modes.map((m) => (
                    <td key={m.id} className="px-5 py-3.5 text-sm">
                      {yesNo(m.phiSafe)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-sm text-slate-300">
                    Works in <strong className="text-white">air-gapped network</strong>
                  </td>
                  {modes.map((m) => (
                    <td key={m.id} className="px-5 py-3.5 text-sm">
                      {yesNo(m.airgapSafe)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-sm text-slate-300">Endpoint</td>
                  {modes.map((m) => (
                    <td
                      key={m.id}
                      className="px-5 py-3.5 text-xs text-brand-300 font-mono break-all"
                    >
                      {m.endpoint}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Mode Details */}
        <section className="mb-16 space-y-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Mode details</h2>
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <article
                key={m.id}
                className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 sm:p-8"
                id={m.id}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl ${m.iconBg} border flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${m.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{m.name}</h3>
                    <p className="text-sm text-slate-400">{m.tagline}</p>
                  </div>
                </div>

                {m.id === "hosted" && (
                  <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200 leading-relaxed">
                      <strong className="text-amber-100">Not for CUI or PHI.</strong> Hosted mode terminates
                      prompts at proxy.houndshield.com. Use only on workloads that contain no Controlled
                      Unclassified Information, no Protected Health Information, and no other regulated data.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                      Trade-off
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{m.trade}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                      Best for
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{m.bestFor}</p>
                  </div>
                </div>

                {m.setupCmd && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      Setup
                    </p>
                    <pre className="border border-white/[0.08] bg-black/40 rounded-xl p-4 text-xs font-mono text-brand-300 overflow-x-auto whitespace-pre">
{m.setupCmd}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Decision flowchart */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">Decision in 30 seconds</h2>
          <div className="border border-white/[0.08] rounded-2xl divide-y divide-white/[0.04]">
            <div className="px-5 py-4 flex items-start gap-4">
              <span className="text-xs font-mono font-bold text-brand-400 flex-shrink-0 mt-0.5">Q1</span>
              <div>
                <p className="text-sm text-white font-medium">
                  Does any prompt your team sends contain CUI, PHI, ITAR/EAR data, or PII?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  → <strong className="text-brand-300">Yes</strong>: skip hosted mode. Go straight to self-hosted Docker.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-4">
              <span className="text-xs font-mono font-bold text-brand-400 flex-shrink-0 mt-0.5">Q2</span>
              <div>
                <p className="text-sm text-white font-medium">
                  Do you operate in an environment with no outbound internet (SCIF, IL-5+, classified)?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  → <strong className="text-brand-300">Yes</strong>: contact sales for air-gapped — Enterprise tier with offline license.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-4">
              <span className="text-xs font-mono font-bold text-brand-400 flex-shrink-0 mt-0.5">Q3</span>
              <div>
                <p className="text-sm text-white font-medium">
                  Are you evaluating the product on non-sensitive workloads?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  → <strong className="text-brand-300">Yes</strong>: hosted trial is fine. Migrate to Docker before touching CUI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "If the hosted mode isn't local-only, why do you advertise local-only on the homepage?",
                a: "Because the product is local-only in the deployment mode every CMMC and HIPAA buyer must use — self-hosted Docker. The hosted trial exists to remove evaluation friction for prospects who haven't bought yet. We label it clearly, we refuse to let CUI flow through it, and we explain the boundary on this page. If our marketing implied otherwise on any other page, please email security@houndshield.com so we can fix it.",
              },
              {
                q: "What's the latency overhead of self-hosted Docker vs hosted?",
                a: "Self-hosted is faster — there's no network round-trip to our infrastructure. Median scan latency is under 10ms on commodity hardware (4 vCPU / 8GB RAM). The hosted trial adds ~30–60ms of network latency depending on customer geography.",
              },
              {
                q: "Can I prove that the Docker container isn't phoning home with prompt content?",
                a: "Yes — run it behind an outbound firewall that allows only houndshield.com:443 and your AI provider's endpoint. Inspect outbound traffic with Wireshark or Datadog Network Monitoring. The container ships an SBOM and a SHA-256-hashed pattern manifest. See /security for verification commands.",
              },
              {
                q: "Do you support Kubernetes / Helm?",
                a: "Yes. We publish a Helm chart at github.com/thecelestialmismatch/HoundShield/charts. Recommended for any deployment beyond a handful of users — handles scaling, rolling updates, and HA.",
              },
              {
                q: "What happens to audit logs if my container restarts or crashes?",
                a: "Audit logs are written to the mounted volume on every event (synchronous fsync, no in-memory buffering). They survive container restarts. For HA, mount to a shared NFS/EBS volume or pipe to your SIEM via syslog / Splunk HEC / Sentinel — connectors ship in the container.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group border border-white/[0.08] rounded-xl bg-white/[0.02] open:bg-white/[0.04]"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-white flex items-start justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-brand-400 text-lg leading-none flex-shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 -mt-1 text-sm text-slate-300 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border border-brand-400/20 bg-brand-400/[0.04] rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-7 h-7 text-brand-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Need help choosing?</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                15-minute call with an RP. We&apos;ll review your contract data classification and recommend a mode.
              </p>
            </div>
          </div>
          <Link
            href="/contact?topic=deployment"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            Book a call <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
