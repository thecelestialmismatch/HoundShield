"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Free Demo", href: "/demo", highlight: true },
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "About", href: "/about" },
        { label: "Changelog", href: "/changelog" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "ShieldReady", href: "/shieldready" },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0c0c10]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20" : "bg-transparent"
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo className="w-8 h-8 group-hover:scale-105 transition-transform" />
                    <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-emerald-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-300 group-hover:scale-105">
                        Kaelus<span className="text-white/90 font-bold">.ai</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link key={link.label} href={link.href} className={
                            (link as any).highlight
                                ? "text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                : "text-sm text-white/60 hover:text-white transition-colors"
                        }>
                            {(link as any).highlight && <Zap className="w-3.5 h-3.5 inline-block mr-1" />}
                            {link.label}
                        </Link>
                    ))}
                    <Link href="/auth" className="text-sm text-white/60 hover:text-white transition-colors">Sign In</Link>
                    <Link href="/auth" className="btn-primary text-sm px-4 py-2">
                        Get Started <ArrowRight className="w-3.5 h-3.5 ml-1 inline-block" />
                    </Link>
                </div>

                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden bg-[#0c0c10]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 space-y-3">
                    {navLinks.map((link) => (
                        <Link key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">
                            {link.label}
                        </Link>
                    ))}
                    <Link href="/auth" className="btn-primary w-full py-3 mt-2 justify-center flex items-center">
                        Get Started <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Link>
                </div>
            )}
        </nav>
    );
}
