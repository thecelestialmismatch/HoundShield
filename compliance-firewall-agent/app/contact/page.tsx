"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { Mail, CalendarCheck, Clock, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/structured-data";
import { contactFaqs } from "@/lib/seo/faqs";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: delay / 1000 }} className={className}>
      {children}
    </motion.div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "General", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A $499 report buyer whose Stripe checkout is unconfigured is deflected here
  // via /contact?topic=assessment-report — tag the subject so the lead is triaged.
  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("topic");
    if (topic === "assessment-report") {
      setForm((f) => ({
        ...f,
        subject: "Assessment Report",
        message: f.message || "I'm interested in the $499 CMMC AI Risk Assessment Report.",
      }));
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
        return;
      }
      // Never a fake success. If delivery isn't wired, show the direct address.
      const fallback = data.fallbackEmail || "contact@houndshield.com";
      setSubmitError(`We couldn't send that just now. Please email us directly at ${fallback} and we'll respond within 4 business hours.`);
    } catch {
      setSubmitError("Network error. Please email us directly at contact@houndshield.com.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-[var(--hs-border)] rounded-xl px-4 py-3 text-sm text-[var(--hs-ink)] placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200";

  const cards = [
    { icon: Mail, color: "text-brand-400", label: "General Inquiries", value: "contact@houndshield.com", sub: "Sales, partnerships, and general questions" },
    { icon: CalendarCheck, color: "text-[var(--hs-success)]", label: "Technical Support", value: "support@houndshield.com", sub: "Integration help and troubleshooting" },
    { icon: Clock, color: "text-brand-400", label: "Response Time", value: "< 4 hours", sub: "During business hours (ET)" },
  ];

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <ScrollProgressBar />
      <NavV3 />

      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Talk to our <span className="bg-gradient-to-r from-[var(--hs-steel-dark)] to-[var(--hs-steel)] bg-clip-text text-transparent">CMMC experts</span>
            </h1>
            <p className="text-lg text-[var(--hs-ink-secondary)] max-w-xl mx-auto leading-relaxed">
              Whether you need help with NIST 800-171, SPRS scoring, or C3PAO preparation -- our team is ready to guide you.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact Method Cards */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <FadeIn key={c.label} delay={i * 100}>
              <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-6 text-center hover:border-[var(--hs-border)] hover:bg-[var(--hs-mist)] transition-all duration-200 cursor-pointer">
                <c.icon className={`w-6 h-6 ${c.color} mx-auto mb-3`} />
                <p className="text-sm font-semibold text-[var(--hs-ink)] mb-1">{c.label}</p>
                <p className="text-sm text-[var(--hs-ink-secondary)] font-medium mb-1">{c.value}</p>
                <p className="text-xs text-[var(--hs-ink-secondary)]">{c.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Form + FAQ two-column */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">

          {/* Contact Form */}
          <FadeIn>
            <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <CheckCircle2 className="w-14 h-14 text-[var(--hs-success)] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message sent</h3>
                    <p className="text-[var(--hs-ink-secondary)] mb-8">We will respond within 4 business hours.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold transition-colors cursor-pointer">
                      Back to Home <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-xl font-bold mb-6">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div>
                        <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5">Name *</label>
                        <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Jane Smith" />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5">Email *</label>
                        <input name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jane@company.com" />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5">Company</label>
                        <input name="company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Acme Defense Corp" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5">Subject</label>
                        <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={`${inputCls} cursor-pointer appearance-none`}>
                          <option value="General">General Inquiry</option>
                          <option value="Sales">Sales</option>
                          <option value="Assessment Report">Assessment Report ($499)</option>
                          <option value="Support">Technical Support</option>
                          <option value="Partnership">Partnership</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5">Message *</label>
                        <textarea name="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className={`${inputCls} resize-none`} placeholder="Tell us about your compliance needs..." />
                        {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer">
                        {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? "Sending..." : "Send Message"}
                      </button>
                      {submitError && <p className="text-sm text-red-500 mt-1" role="alert">{submitError}</p>}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* FAQ — shared accordion + FAQPage JSON-LD (AEO) */}
          <FadeIn delay={150}>
            <div>
              <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
              <JsonLd schema={faqPageSchema(contactFaqs)} />
              <FaqAccordion items={contactFaqs} />
            </div>
          </FadeIn>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
