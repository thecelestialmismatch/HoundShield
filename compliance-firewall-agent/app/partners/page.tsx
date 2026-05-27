import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HandshakeIcon,
  AlertTriangle,
  DollarSign,
  FileCheck,
  Users,
  Calendar,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";

export const metadata: Metadata = {
  title: "Partners — HoundShield (RPO & MSP Channel)",
  description:
    "Co-brand the $499 CMMC AI Risk Report. $299 wholesale, 40-50% margin. For Registered Practitioner Organizations and CMMC-focused MSPs. Not for C3PAOs — they are legally prohibited from product endorsement under 32 CFR Part 170.",
  alternates: { canonical: "https://houndshield.com/partners" },
};

// Top RPOs from the Cyber AB Marketplace — used as social-proof seeds + outreach priority list.
const RPO_TARGETS = [
  "Summit 7",
  "MAD Security",
  "CyberSheath",
  "CompliancePoint",
  "BEMO",
  "Steel Root",
  "Etactics",
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <Navbar variant="dark" />

      {/* Hero — RPO/MSP co-brand pitch */}
      <section className="px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-3">
            RPO &amp; MSP Channel
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.05]">
            Co-brand the $499 CMMC AI Risk Report.<br className="hidden sm:block" />
            Keep 40–50% margin.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-3xl">
            Registered Practitioner Organizations and CMMC-focused MSPs resell the HoundShield
            CMMC AI Risk Report at <strong className="text-white">$299 wholesale</strong>. Your
            client receives a PDF co-branded with your firm. We provision the proxy in Mode B
            (Docker) inside their environment, you own the relationship.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/contact?intent=rpo-partner"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              Apply to the partner program <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Review the data-path first <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* NOT for C3PAOs — front and center, before any economics */}
      <section className="px-6 py-10 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="border border-amber-400/30 bg-amber-500/[0.06] rounded-2xl p-6 flex gap-4 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-100 mb-1">
                This program is NOT for C3PAOs.
              </p>
              <p className="text-amber-200/80">
                C3PAOs (Certified Third Party Assessor Organizations) are legally prohibited from
                recommending products to clients they assess under 32 CFR Part 170, the CMMC Code
                of Professional Conduct, and ISO 17020 cooling-off rules. Accepting a co-brand
                arrangement with a product vendor would put your accreditation at risk. If you are
                a C3PAO assessor, please do not apply — and let us know so we can build a separate,
                non-revenue assessor-portal experience that does not jeopardize your standing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Economics — flat $300 margin per $499 sale */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight text-center">
            The math
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-center">
            One number. Per client. No revenue-share tiers, no minimums, no annual ramp.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Client pays you
              </p>
              <p className="text-4xl font-bold font-mono text-white mb-1">$499</p>
              <p className="text-xs text-slate-500">retail (or your markup — your call)</p>
            </div>
            <div className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                You pay HoundShield
              </p>
              <p className="text-4xl font-bold font-mono text-white mb-1">$299</p>
              <p className="text-xs text-slate-500">wholesale, invoiced monthly</p>
            </div>
            <div className="border border-emerald-400/40 bg-emerald-500/[0.06] rounded-2xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold mb-2">
                Your margin
              </p>
              <p className="text-4xl font-bold font-mono text-emerald-300 mb-1">$200+</p>
              <p className="text-xs text-emerald-300/70">40–50% per engagement</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            RPOs already charge clients{" "}
            <strong className="text-white">$5K–$15K for a gap assessment</strong>. Adding the
            HoundShield report to your engagement package — at a marked-up $999–$1,499 — turns
            a single AI-control gap into a $700–$1,200 line item.
          </p>
        </div>
      </section>

      {/* What you get — co-brand pack */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight text-center">
            What&rsquo;s in the partner pack
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-center">
            Everything you need to run a co-branded $499 engagement end-to-end.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: FileCheck,
                title: "Co-branded PDF template",
                desc: "Your logo, your firm name, your contact block. The technical content stays HoundShield's.",
              },
              {
                icon: Users,
                title: "Provisioning runbook",
                desc: "Step-by-step for deploying Mode B (Docker) into a client environment in under 30 minutes.",
              },
              {
                icon: Calendar,
                title: "14-day kickoff cadence",
                desc: "We schedule the kickoff with your client within one business day of your booking.",
              },
              {
                icon: DollarSign,
                title: "Monthly net-30 invoicing",
                desc: "Bill us $299 per delivered report. Net 30. No reconciliation games.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-emerald-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outreach priority — top RPO list as social-proof seeds */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            Who we&rsquo;re building this with
          </h2>
          <p className="text-slate-400 mb-6 max-w-2xl leading-relaxed">
            We are actively pursuing a launch cohort of {RPO_TARGETS.length} RPOs from the Cyber
            AB Marketplace. If your firm is below — or fits the same profile (RPO or
            CMMC-focused MSP, 10+ DIB clients) — you&rsquo;re exactly who we want to talk to first.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {RPO_TARGETS.map((rpo) => (
              <span
                key={rpo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-slate-300"
              >
                <HandshakeIcon className="w-3.5 h-3.5 text-emerald-300" />
                {rpo}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sourcing methodology: Cyber AB Marketplace RPO directory + LinkedIn search
            (&ldquo;RPO&rdquo; + &ldquo;CMMC&rdquo; + &ldquo;managed services&rdquo;). Not an
            endorsement claim — these are firms we have identified as targets, not signed
            partners. Updated as agreements are executed.
          </p>
        </div>
      </section>

      {/* Application — single page */}
      <section className="px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 tracking-tight text-center">
            Apply in 60 seconds
          </h2>
          <div className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              Email{" "}
              <a
                href="mailto:partners@houndshield.com?subject=RPO%2FMSP%20Partner%20Application"
                className="text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                partners@houndshield.com
              </a>{" "}
              with the following:
            </p>
            <ul className="space-y-2.5">
              {[
                "Firm name + Cyber AB Marketplace listing URL (RPOs) or website (MSPs).",
                "Approximate number of DIB / regulated clients you serve today.",
                "One existing engagement you would pilot the $499 report with — name optional.",
                "Are you a C3PAO? (If yes, please describe the firewall between your RP / MSP work and your C3PAO assessor work — we will not enter an arrangement that compromises your accreditation.)",
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <Check className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 pt-4 border-t border-white/[0.06]">
              We respond within one business day. First call is 30 minutes — walkthrough of the
              report, the proxy, the co-brand pack, and the math. No deck.
            </p>
          </div>
          <div className="text-center mt-6">
            <Link
              href="/contact?intent=rpo-partner"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              Or use the contact form <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-12 border-t border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 tracking-tight text-center">
            Honest answers
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "What if my client refuses to install Docker in their environment?",
                a: "Then the engagement does not happen. The Mode B (Docker) deployment is the only CUI-safe path. Mode A (hosted) is explicitly NOT for CUI. If a client cannot or will not run Docker, refund the deposit and move on — we will not help you sell a report that depends on a non-compliant deployment.",
              },
              {
                q: "Do I need to be a HoundShield reseller? White-label? Affiliate?",
                a: "No. There is one program: co-brand the $499 gap report at $299 wholesale. No reseller agreement, no white-label license, no affiliate tracking links. We invoice you net-30 per delivered report. You invoice your client however your contracts already work.",
              },
              {
                q: "What about the Stage 2 subscription tiers ($299 / $799 / $1,499)?",
                a: "Those launch in July 2026 (Stage 2). When they go live, channel partners get a recurring 30% share on subscriptions they refer for the first 12 months. Same invoicing pattern, paid quarterly. We will email all active partners 30 days before launch.",
              },
              {
                q: "Is HoundShield SOC 2 certified?",
                a: "SOC 2 Type I is in progress (target July 2026 start). If your client's procurement requires SOC 2 from the vendor before signing, we are not the right fit yet for that client. Mode B + the $499 report is, because HoundShield is not processing the data — it runs inside their boundary.",
              },
              {
                q: "What if my client wants a subscription instead of a one-time report?",
                a: "Tell them to wait or sign them up for the Stage 2 waitlist on /pricing. We are not selling subscription seats until July 2026. We learned this lesson the hard way — see DECISIONS.md 2026-05-26 if you want the receipts.",
              },
              {
                q: "Where do I report a problem during a co-brand engagement?",
                a: "partners@houndshield.com — same address as your application. Security issues: security@houndshield.com (24-hour acknowledgement SLA, 72-hour triage).",
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
