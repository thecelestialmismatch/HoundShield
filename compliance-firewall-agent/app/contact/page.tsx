"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { Mail, CalendarCheck, Clock, Send, ChevronDown, CheckCircle2, Shield, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: delay / 1000 }} className={className}>
      {children}
    </motion.div>
  );
}

const faqs = [
  { q: "What is CMMC Level 2?", a: "CMMC Level 2 requires organizations to implement 110 security practices from NIST SP 800-171 to protect Controlled Unclassified Information (CUI). It is mandatory for defense contractors handling CUI and requires third-party assessment." },
  { q: "How long does compliance take?", a: "Timelines vary based on your current posture. Most organizations achieve CMMC Level 2 readiness in 3-6 months with Kaelus.online. Our platform identifies gaps instantly and provides a prioritized remediation roadmap." },
  { q: "Do I need a C3PAO assessment?", a: "Yes, CMMC Level 2 certification requires an assessment by a CMMC Third-Party Assessment Organization (C3PAO). Kaelus.online prepares you for this assessment by running continuous self-assessments aligned to official scoring methodology." },
  { q: "What's included in the free tier?", a: "The free tier includes a baseline SPRS score, gap analysis for up to 25 NIST 800-171 controls, basic compliance reporting, and access to our AI compliance assistant. Upgrade to Pro for full 110-control coverage." },
  { q: "Can I export compliance reports?", a: "Absolutely. Export audit-ready PDF and CSV reports including your System Security Plan (SSP), Plan of Action & Milestones (POA&M), and SPRS scoring worksheets -- all formatted for C3PAO review." },
  { q: "Is my data secure?", a: "Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use isolated tenancy, immutable audit logs with SHA-256 hashing, and never train AI models on your data. Infrastructure is hosted on FedRAMP-authorized cloud services." },
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
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1500);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200";

  const cards = [
    { icon: Mail, color: "text-indigo-400", label: "Email Us", value: "info@kaelus.online", sub: "For general and technical inquiries" },
    { icon: CalendarCheck, color: "text-emerald-400", label: "Schedule a Demo", value: "Book a 30-min call", sub: "See Kaelus.online in action, live" },
    { icon: Clock, color: "text-amber-400", label: "Response Time", value: "< 4 hours", sub: "During business hours (ET)" },
  ];

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* Hero */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Talk to our <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">CMMC experts</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
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
              <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center hover:border-white/[0.12] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer">
                <c.icon className={`w-6 h-6 ${c.color} mx-auto mb-3`} />
                <p className="text-sm font-semibold text-white mb-1">{c.label}</p>
                <p className="text-sm text-slate-400 font-medium mb-1">{c.value}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
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
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message sent</h3>
                    <p className="text-slate-400 mb-8">We will respond within 4 business hours.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors cursor-pointer">
                      Back to Home <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-xl font-bold mb-6">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Name *</label>
                        <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Jane Smith" />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Email *</label>
                        <input name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jane@company.com" />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Company</label>
                        <input name="company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Acme Defense Corp" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Subject</label>
                        <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={`${inputCls} cursor-pointer appearance-none`}>
                          <option value="General">General Inquiry</option>
                          <option value="Sales">Sales</option>
                          <option value="Support">Technical Support</option>
                          <option value="Partnership">Partnership</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Message *</label>
                        <textarea name="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className={`${inputCls} resize-none`} placeholder="Tell us about your compliance needs..." />
                        {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer">
                        {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? "Sending..." : "Send Message"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* FAQ Accordion */}
          <FadeIn delay={150}>
            <div>
              <h2 className="text-xl font-bold mb-6">Frequently asked questions</h2>
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <div key={i} className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-white/[0.12] transition-colors duration-200">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer">
                      <span className="text-sm font-medium text-slate-200">{f.q}</span>
                      <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                          <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo className="w-8 h-8" />
                <TextLogo variant="dark" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">AI compliance firewall. Real-time interception. Encrypted quarantine. Immutable audit trails.</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-4">Product</p>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Features</Link>
                <Link href="/pricing" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Pricing</Link>
                <Link href="/command-center" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Command Center</Link>
                <Link href="/changelog" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Changelog</Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-4">Compliance</p>
              <div className="space-y-2.5">
                <span className="block text-sm text-slate-400">SOC 2</span>
                <span className="block text-sm text-slate-400">GDPR</span>
                <span className="block text-sm text-slate-400">EU AI Act</span>
                <span className="block text-sm text-slate-400">HIPAA</span>
                <span className="block text-sm text-slate-400">CMMC / NIST 800-171</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-4">Company</p>
              <div className="space-y-2.5">
                <Link href="/about" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">About</Link>
                <Link href="/docs" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Documentation</Link>
                <Link href="/contact" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Contact</Link>
                <Link href="/signup" className="block text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer">Get Started</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; 2026 Kaelus.online -- All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</Link>
              <Link href="/docs" className="hover:text-slate-300 transition-colors cursor-pointer">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
