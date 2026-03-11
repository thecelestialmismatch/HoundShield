"use client";

import { TextLogo } from "@/components/TextLogo";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AnimatedSection } from "@/components/landing/animated-section";
import { Mail, MessageSquare, Clock, CheckCircle2, ArrowRight, Send } from "lucide-react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="orb orb-1" />
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-semibold mb-4">Get in Touch</p>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                            Contact <span className="text-gradient-brand">Us</span>
                        </h1>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            Have questions? Need a custom deployment? We&apos;re here to help.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Contact Methods */}
            <section className="py-8 px-6">
                <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 mb-16">
                    <AnimatedSection delay={0}>
                        <div className="glass-card p-6 text-center">
                            <Mail className="w-6 h-6 text-brand-400 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-white mb-1">Email</h3>
                            <p className="text-xs text-white/40">hello@kaelus.ai</p>
                        </div>
                    </AnimatedSection>
                    <AnimatedSection delay={100}>
                        <div className="glass-card p-6 text-center">
                            <MessageSquare className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-white mb-1">Live Chat</h3>
                            <p className="text-xs text-white/40">Available on our homepage</p>
                        </div>
                    </AnimatedSection>
                    <AnimatedSection delay={200}>
                        <div className="glass-card p-6 text-center">
                            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-white mb-1">Response Time</h3>
                            <p className="text-xs text-white/40">Within 24 hours</p>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-8 px-6 pb-20">
                <div className="max-w-xl mx-auto">
                    <AnimatedSection>
                        {submitted ? (
                            <div className="glass-card-glow p-12 text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-white/40 mb-8">We&apos;ll get back to you within 24 hours.</p>
                                <Link href="/" className="btn-primary px-8 py-3.5">
                                    Back to Home <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="glass-card-glow p-8 md:p-10">
                                <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Name</label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Company</label>
                                        <input
                                            name="company"
                                            value={form.company}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                            placeholder="Company name (optional)"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Message</label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all resize-none"
                                            placeholder="Tell us how we can help..."
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary w-full !py-4">
                                        <Send className="w-4 h-4" /> Send Message
                                    </button>
                                </form>
                            </div>
                        )}
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <TextLogo />
                    </Link>
                    <p className="text-xs text-white/20">&copy; 2026 Kaelus.ai — All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
