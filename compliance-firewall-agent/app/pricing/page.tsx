import type { Metadata } from "next";
import Link from "next/link";
import {
  FileCheck,
  ArrowRight,
  Check,
  Server,
  HandshakeIcon,
  Calendar,
  Users,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";

export const metadata: Metadata = {
  title: "Pricing — HoundShield",
  description:
    "Lead product: $499 one-time CMMC AI Risk Assessment Report. Stage 2 subscription tiers ($299/$799/$1,499) available July 2026. RPO/MSP co-brand at $299 wholesale.",
  alternates: { canonical: "https://houndshield.com/pricing" },
};

type Stage2Tier = {
  name: string;
  monthly: number;
  description: string;
  features: string[];
  highlighted: boolean;
};

const stage2: Stage2Tier[] = [
  {
    name: "Starter",
    monthly: 299,
    description: "Quarterly gap report + basic monitoring for a single tenant.",
    features: [
      "Quarterly $499 gap report credit",
      "Mode B (Docker) deployment, single org",
      "10 user seats",
      "Basic dashboard + 30-day log retention",
      "Email alerts on violations",
      "Email support (next business day)",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 799,
    description: "Continuous detection, Slack alerts, C3PAO-ready PDF on demand.",
    features: [
      "Everything in Starter",
      "Continuous prompt scanning (Mode B)",
      "50 user seats",
      "Slack + email alert routing",
      "C3PAO-ready PDF report — generate any time",
      "90-day log retention",
      "Priority support (4-hour SLA)",
      "SIEM connector (Splunk HEC or Azure Sentinel)",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: 1499,
    description: "Mode B/C deployment support, dedicated CSM, air-gapped option.",
    features: [
      "Everything in Pro",
      "Mode C (air-gapped) deployment support",
      "Unlimited user seats",
      "Dedicated Customer Success Manager",
      "1-year log retention",
      "Custom NIST 800-171 control mapping review",
      "Quarterly compliance posture review",
      "SOC 2 Type I report (when complete)",
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <Navbar variant="dark" />

      {/* Hero — $499 one-time, the actual lead product */}
      <section className="px-6 pt-24 pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
            Stage 1 — Lead Product
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.05]">
            $499. One-time. C3PAO-ready PDF in two weeks.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            Deploy the HoundShield proxy in Mode B (Docker) inside your environment for 14 days.
            Receive a SHA-256-signed PDF showing every AI prompt event risk-scored against the
            110 NIST 800-171 Rev 2 controls. No subscription. No MSA. Bypasses procurement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link
              href="/contact?intent=gap-report"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              Order the $499 Gap Report <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              Review the data-path first <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            14-day deployment &nbsp;·&nbsp; Mode B (Docker, your infrastructure) &nbsp;·&nbsp; 30-day money-back
          </p>
        </div>
      </section>

      {/* What's in the report */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight text-center">
            What you get for $499
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-center">
            RPOs charge $5K–$15K for the equivalent gap assessment. Same evidence, same control
            mapping, fixed price, no proposals.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Server,
                title: "Mode B deployment",
                desc: "HoundShield Docker image runs inside your network. Prompt content never leaves your boundary.",
              },
              {
                icon: Calendar,
                title: "14-day observation",
                desc: "Live scanning of every prompt your team sends to ChatGPT, Copilot, Claude, and Gemini.",
              },
              {
                icon: FileCheck,
                title: "Signed PDF",
                desc: "Every event mapped to NIST 800-171 Rev 2 controls. SHA-256 hash chain you can verify offline.",
              },
              {
                icon: Shield,
                title: "Hand-off ready",
                desc: "Send the PDF directly to your assessor or compliance officer. No editing required.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-400/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RPO/MSP co-brand */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="border border-emerald-400/20 bg-emerald-500/[0.04] rounded-2xl p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                <HandshakeIcon className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 font-semibold mb-1.5">
                  RPO + MSP Channel
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Co-brand the gap report. Keep 40–50% margin.
                </h2>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              Registered Practitioner Organizations and CMMC-focused MSPs can resell the $499 gap
              report at <strong className="text-white">$299 wholesale</strong>. Your client receives
              a PDF co-branded with your firm. We provision the proxy, you own the relationship.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Not for C3PAOs — they are legally prohibited from product endorsement to clients they
              assess (32 CFR Part 170, ISO 17020 cooling-off). This channel is RPOs + MSPs only.
            </p>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              Become a partner <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stage 2 subscription tiers — clearly marked future */}
      <section className="px-6 py-16 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full border border-slate-500/40 bg-slate-500/10 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
              Stage 2 — Available July 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
              Subscription tiers (after the gap report)
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Continuous monitoring tiers launch in Stage 2 — after the lead $499 gap report has
              proven value with the first cohort of paying customers. Reserve a slot below.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {stage2.map((tier) => (
              <div
                key={tier.name}
                className={`relative border rounded-2xl p-6 flex flex-col ${
                  tier.highlighted
                    ? "border-brand-400/40 bg-brand-500/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block px-3 py-1 rounded-full border border-brand-400/50 bg-brand-500/20 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-300">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold font-mono text-white">
                    ${tier.monthly}
                  </span>
                  <span className="text-sm text-slate-400">/ month</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                  {tier.description}
                </p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/contact?intent=stage2-${tier.name.toLowerCase()}`}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-brand-600 hover:bg-brand-700 text-white"
                      : "border border-white/[0.12] hover:border-white/[0.24] text-white"
                  }`}
                >
                  Reserve a slot <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6 font-mono">
            Annual discount 17% &nbsp;·&nbsp; 30-day money-back &nbsp;·&nbsp; Cancel any time
          </p>
        </div>
      </section>

      {/* Audit Pack add-on */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <div className="border border-white/[0.08] bg-white/[0.03] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-400/30 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-1.5">
                Add-On
              </p>
              <h2 className="text-xl font-bold mb-2">Audit Pack — $999 one-time</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                SSP + POA&amp;M + 14 policy templates aligned to NIST 800-171 Rev 2, plus a
                1-hour expert review with a CMMC-experienced compliance engineer. Pairs with
                the $499 gap report to give your assessor the full documentation set.
              </p>
              <Link
                href="/contact?intent=audit-pack"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Add to your gap report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mode-A warning — at the bottom, hard to miss */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="border border-amber-400/30 bg-amber-500/[0.06] rounded-2xl p-6 flex gap-4 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-200 mb-1">
                Mode A trial is NOT for CUI, PHI, or contract data.
              </p>
              <p className="text-amber-200/80">
                If you sign up for a free trial via the homepage, you receive a Mode A hosted
                endpoint (<code className="font-mono text-xs">proxy.houndshield.com</code>) which
                runs on Vercel and is NOT FedRAMP-authorized. The $499 gap report deploys the
                proxy in Mode B (Docker) inside your environment — that&rsquo;s the CUI-safe path.
                See{" "}
                <Link href="/security" className="text-amber-200 underline hover:text-amber-100">
                  the security page
                </Link>{" "}
                for the full data-flow statement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — using native details/summary, zero client JS */}
      <section className="px-6 py-16 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 tracking-tight text-center">
            Honest answers
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Why $499 and not a subscription?",
                a: "A $499 PO bypasses procurement in most organizations. A subscription requires MSA review. We want the path to first-paid customer to be as short as possible, and the gap report is genuinely useful evidence even if you never buy the subscription.",
              },
              {
                q: "What happens after the 14 days?",
                a: "You keep the PDF. You can uninstall the proxy or leave it running. There is no auto-conversion to a subscription — Stage 2 subscription tiers don't launch until July 2026, and even then you have to explicitly opt in.",
              },
              {
                q: "Is the hosted endpoint CUI-safe?",
                a: "No. The hosted endpoint at proxy.houndshield.com is Mode A — Vercel-hosted, NOT FedRAMP-authorized, NOT for CUI. Mode B (Docker, your infrastructure) is the CUI-safe deployment. Mode C (air-gapped) is required for IL-5 and SAP environments.",
              },
              {
                q: "Do you have a SOC 2 report?",
                a: "Not yet. SOC 2 Type I is in progress (target July 2026 start). If your procurement requires SOC 2 from the vendor before signing, Mode A and the subscription tiers aren't a fit for you yet. Mode B + the $499 gap report is, because HoundShield doesn't process your data — it runs inside your boundary.",
              },
              {
                q: "Why not work through C3PAOs?",
                a: "C3PAOs are legally prohibited from recommending products to clients they assess (32 CFR Part 170, CMMC Code of Professional Conduct, ISO 17020 cooling-off rules). Working through them as a sales channel would put their accreditation at risk. We work through RPOs and CMMC-focused MSPs instead.",
              },
              {
                q: "What if I find a bug or vulnerability?",
                a: "Email security@houndshield.com with reproduction steps. We acknowledge within 24 hours and triage within 72.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group border border-white/[0.08] bg-white/[0.02] rounded-xl overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-semibold text-white hover:bg-white/[0.04] transition-colors">
                  <span>{item.q}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-400/30 flex items-center justify-center mx-auto mb-5">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">
            Two weeks. One PDF. $499.
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Email{" "}
            <a
              href="mailto:info@houndshield.com?subject=$499%20CMMC%20AI%20Risk%20Report"
              className="text-brand-400 hover:text-brand-300"
            >
              info@houndshield.com
            </a>{" "}
            or open the contact form — we&rsquo;ll schedule the kickoff call within one business day.
          </p>
          <Link
            href="/contact?intent=gap-report"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            Order the $499 Gap Report <ArrowRight className="w-4 h-4" />
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
