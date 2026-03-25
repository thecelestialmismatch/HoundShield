"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";


const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/hipaa", label: "HIPAA" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dark variant: frosted dark glass on scroll
  const frostedClass = isDark
    ? "bg-[#07070b]/85 backdrop-blur-xl border-b border-indigo-500/15"
    : "nav-frosted shadow-sm";

  // Link styles
  const linkActive = isDark
    ? "text-brand-400 bg-brand-500/10"
    : "text-brand-500 bg-brand-50";
  const linkDefault = isDark
    ? "text-slate-400 hover:text-white hover:bg-white/5"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  const signInClass = isDark
    ? "text-sm font-medium text-slate-400 hover:text-white px-3 py-2 transition-colors"
    : "text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors";
  const hamburgerClass = isDark
    ? "md:hidden p-2 text-slate-400 hover:text-white"
    : "md:hidden p-2 text-slate-600 hover:text-slate-900";

  // Mobile menu styles
  const mobileBg = isDark
    ? "bg-[#0e0e18]/95 backdrop-blur-xl border-b border-indigo-500/15"
    : "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg";
  const mobileLinkDefault = isDark
    ? "text-slate-400 hover:bg-white/5 hover:text-white"
    : "text-slate-600 hover:bg-slate-50";
  const mobileDivider = isDark
    ? "pt-3 border-t border-white/5 flex flex-col gap-2"
    : "pt-3 border-t border-slate-100 flex flex-col gap-2";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? frostedClass : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo />
            <TextLogo className="text-lg" variant={variant} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href ? linkActive : linkDefault
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className={signInClass}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm px-5 py-2.5"
            >
              Start Free
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={hamburgerClass}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-x-0 top-16 z-40 md:hidden ${mobileBg}`}
          >
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg ${
                    pathname === link.href ? linkActive : mobileLinkDefault
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className={mobileDivider}>
                <Link href="/login" className="btn-ghost text-center w-full">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-center w-full">
                  Start Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
