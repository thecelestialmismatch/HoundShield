"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, LifeBuoy, Clock, Send, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

const FAQS = [
  { q: "What is CMMC Level 2?", a: "CMMC Level 2 requires defense contractors handling CUI to implement all 110 NIST SP 800-171 Rev 2 practices and pass a third-party (C3PAO) assessment. Enforcement begins November 2026." },
  { q: "How does HoundShield help before an assessment?", a: "It scans every AI prompt your team sends for CUI/PHI/PII in under 10ms, blocks leaks before they leave your network, and produces a C3PAO-ready PDF evidence package mapped to the 110 controls." },
  { q: "Does prompt content ever leave my network?", a: "No. The scanning engine, detection patterns, and audit logs all run on your infrastructure. Only a license-key hash and prompt count (no content) leave for billing." },
  { q: "How long does setup take?", a: "Under 10 minutes. Point your AI tools' base URL at your HoundShield endpoint — no agents, no firewall rules, no code changes. Docker self-host is three commands." },
  { q: "Can I export compliance reports?", a: "Yes. Export audit-ready PDF evidence — SPRS scoring, 110-control gap analysis, and remediation priorities — formatted for C3PAO review. Available on Growth and above." },
  { q: "Is my data secure?", a: "Prompt text is never stored in plaintext (SHA-256 hashed), quarantined content is AES-256 encrypted, and the audit trail is a tamper-evident hash chain." },
];

const CARDS = [
  { icon: Mail, label: "General & sales", value: BRAND.email.general, sub: "Partnerships and general questions" },
  { icon: LifeBuoy, label: "Technical support", value: BRAND.email.support, sub: "Integration help and troubleshooting" },
  { icon: Clock, label: "Response time", value: "< 4 hours", sub: "During business hours (ET)" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "General", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  const inputCls =
    "w-full bg-white border border-[var(--hs-border)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-[var(--hs-steel)] focus:ring-1 focus:ring-[var(--hs-steel)]/30 transition-all font-[var(--font-body)]";

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* Hero */}
      <section className="spotlight relative pt-28 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Talk to our <span className="text-gradient-brand">CMMC experts.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] max-w-xl mx-auto leading-relaxed font-[var(--font-body)]">
            NIST 800-171, SPRS scoring, or C3PAO prep — tell us where you are and we&apos;ll point you at the fastest path.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
          {CARDS.map((c) => (
            <div key={c.label} className="glass-card p-6 text-center">
              <c.icon className="w-6 h-6 text-[var(--hs-steel-dark)] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--hs-ink)] mb-1 font-[var(--font-body)]">{c.label}</p>
              <p className="text-sm text-[var(--hs-steel-dark)] font-medium mb-1 font-[var(--font-body)]">{c.value}</p>
              <p className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
          {/* Form */}
          <div className="glass-card p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-14 h-14 text-[var(--hs-success)] mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-[var(--hs-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>Message sent</h3>
                <p className="text-[var(--hs-ink-secondary)] mb-8 font-[var(--font-body)]">We&apos;ll respond within 4 business hours.</p>
                <Link href="/" className="btn-primary text-sm inline-flex">
                  Back to home <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[var(--hs-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-body)]">Name *</label>
                    <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Jane Smith" />
                    {errors.name && <p className="text-xs text-[var(--hs-danger)] mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-body)]">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jane@company.com" />
                    {errors.email && <p className="text-xs text-[var(--hs-danger)] mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-body)]">Company</label>
                    <input name="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Acme Defense Corp" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-body)]">Subject</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={`${inputCls} cursor-pointer appearance-none`}>
                      <option value="General">General Inquiry</option>
                      <option value="Sales">Sales</option>
                      <option value="Support">Technical Support</option>
                      <option value="Partnership">C3PAO / Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-body)]">Message *</label>
                    <textarea name="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className={`${inputCls} resize-none`} placeholder="Tell us about your compliance timeline..." />
                    {errors.message && <p className="text-xs text-[var(--hs-danger)] mt-1">{errors.message}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm disabled:opacity-60">
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? "Sending..." : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--hs-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>Frequently asked</h2>
            <div className="space-y-3">
              {FAQS.map((f, i) => (
                <div key={f.q} className="rounded-[var(--radius-lg)] border border-[var(--hs-border)] bg-white overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer">
                    <span className="text-sm font-medium text-[var(--hs-ink)] font-[var(--font-body)]">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[var(--hs-ink-tertiary)] flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <p className="px-5 pb-4 text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
