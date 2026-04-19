"use client";

import { useRef, useEffect } from "react";
import { Mail, Twitter, Github } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Platform", href: "/features" },
  { label: "Solutions", href: "/hipaa" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL = [
  { icon: Mail, href: "mailto:hello@kaelus.online", label: "Email" },
  { icon: Twitter, href: "https://twitter.com/kaelusonline", label: "Twitter" },
  { icon: Github, href: "https://github.com/kaelus-online", label: "GitHub" },
];

function SocialBtn({ icon: Icon, href, label }: { icon: typeof Mail; href: string; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center hover:bg-white/10 transition-colors duration-200"
    >
      <Icon size={20} className="text-cream" />
    </a>
  );
}

export function KaelusHeroV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden rounded-b-[32px]">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#010828]/40" />

      {/* Content */}
      <div className="relative z-10 max-w-[1831px] mx-auto px-6 sm:px-10 lg:px-16 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between pt-8">
          {/* Logo */}
          <span className="font-grotesk text-[16px] uppercase text-cream tracking-widest">
            Kaelus
          </span>

          {/* Center nav — desktop only */}
          <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px]">
            <ul className="flex items-center gap-10">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-grotesk text-[13px] uppercase text-cream hover:text-neon transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social icons — desktop stacked right */}
          <div className="hidden lg:flex flex-col gap-3">
            {SOCIAL.map((s) => (
              <SocialBtn key={s.label} {...s} />
            ))}
          </div>
        </header>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center lg:ml-32 mt-16 lg:mt-0">
          <div className="relative max-w-[780px]">
            {/* Cursive accent */}
            <span
              className="
                absolute -right-4 lg:-right-28 top-0
                font-condiment text-neon normal-case
                text-2xl sm:text-4xl lg:text-5xl
                -rotate-1 mix-blend-exclusion opacity-90 select-none
              "
            >
              AI Firewall
            </span>

            <h1
              className="
                font-grotesk uppercase text-cream
                text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px]
                leading-[1.05] sm:leading-[1]
              "
            >
              Beyond AI
              <br />
              and{" "}
              <span className="text-cream/70">( its )</span>
              <br />
              compliance
              <br />
              failures
            </h1>
          </div>

          {/* Mobile social icons */}
          <div className="flex lg:hidden gap-4 mt-10 justify-center">
            {SOCIAL.map((s) => (
              <SocialBtn key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
