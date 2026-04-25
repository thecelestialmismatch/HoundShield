"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Twitter, Github } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Platform", href: "/features" },
  { label: "Solutions", href: "/hipaa" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL = [
  { icon: Mail, href: "mailto:hello@houndshield.com", label: "Email" },
  { icon: Twitter, href: "https://twitter.com/houndshield", label: "Twitter" },
  { icon: Github, href: "https://github.com/houndshield", label: "GitHub" },
];

const ease = [0.16, 1, 0.3, 1] as const;

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

export function HoundShieldHeroV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden rounded-b-[32px] noise-overlay">
      {/* Video background — hero loads immediately */}
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
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-grotesk text-[16px] uppercase text-cream tracking-widest"
          >
            Hound Shield
          </motion.span>

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px]"
          >
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
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="hidden lg:flex flex-col gap-3"
          >
            {SOCIAL.map((s) => (
              <SocialBtn key={s.label} {...s} />
            ))}
          </motion.div>
        </header>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center lg:ml-32 mt-16 lg:mt-0">
          <div className="relative max-w-[780px]">
            <motion.span
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.0, ease }}
              className="
                absolute -right-4 lg:-right-28 top-0
                font-condiment text-neon normal-case
                text-2xl sm:text-4xl lg:text-5xl
                -rotate-1 mix-blend-exclusion select-none
              "
            >
              AI Firewall
            </motion.span>

            <h1
              className="
                font-grotesk uppercase text-cream
                text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px]
                leading-[1.05] sm:leading-[1]
              "
            >
              {(["Beyond AI", null, "compliance", "failures"] as const).map((line, i) => (
                <motion.span
                  key={i}
                  className="block"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease }}
                >
                  {i === 1 ? (
                    <>and <span className="text-cream/70">( its )</span></>
                  ) : line}
                </motion.span>
              ))}
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex lg:hidden gap-4 mt-10 justify-center"
          >
            {SOCIAL.map((s) => (
              <SocialBtn key={s.label} {...s} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
