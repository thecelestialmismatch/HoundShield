"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Twitter, Github } from "lucide-react";

const SOCIAL = [
  { icon: Mail, href: "mailto:hello@houndshield.com", label: "Email" },
  { icon: Twitter, href: "https://twitter.com/houndshield", label: "Twitter" },
  { icon: Github, href: "https://github.com/houndshield", label: "GitHub" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const textContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const lineVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};

function useLazyVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
          obs.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export function HoundShieldCTAV2() {
  const videoRef = useLazyVideo();

  return (
    <section className="relative overflow-hidden noise-overlay">
      {/* Video at native aspect ratio */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="w-full h-auto block"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
          type="video/mp4"
        />
      </video>

      {/* Text overlay — right-aligned */}
      <div className="absolute inset-0 flex items-center justify-end lg:pr-[20%] lg:pl-[15%] px-6">
        <div className="relative text-right">
          {/* "Go beyond" cursive */}
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease }}
            className="
              absolute -top-6 sm:-top-12 lg:-top-20 left-0
              font-condiment text-neon normal-case
              text-[17px] sm:text-[36px] lg:text-[68px]
              mix-blend-exclusion select-none
            "
          >
            Go beyond
          </motion.span>

          <motion.h2
            className="
              font-grotesk uppercase text-cream
              text-[16px] sm:text-[32px] lg:text-[60px]
              leading-[1.05]
            "
            variants={textContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.span variants={lineVariants} className="block mb-4 sm:mb-8 lg:mb-12">
              ACTIVATE NOW.
            </motion.span>
            <motion.span variants={lineVariants} className="block">
              GUARD WHAT&apos;S HIDDEN.
            </motion.span>
            <motion.span variants={lineVariants} className="block">
              COMPLY WITHOUT FRICTION.
            </motion.span>
            <motion.span variants={lineVariants} className="block">
              FOLLOW THE SIGNAL.
            </motion.span>
          </motion.h2>
        </div>
      </div>

      {/* Social icons — bottom-left absolute */}
      <motion.div
        className="absolute left-[8%] bottom-[12%] sm:bottom-[16%] lg:bottom-[20%]"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, delay: 0.3, ease }}
      >
        <div className="liquid-glass rounded-[0.5rem] sm:rounded-[0.875rem] lg:rounded-[1.25rem] overflow-hidden">
          {SOCIAL.map(({ icon: Icon, href, label }, idx) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className={[
                "flex items-center justify-center",
                "w-[14vw] sm:w-[7rem] md:w-[8rem] lg:w-[10rem]",
                "h-[14vw] sm:h-[5rem] md:h-[5rem] lg:h-[6rem]",
                "hover:bg-white/10 transition-colors duration-200",
                idx < SOCIAL.length - 1 ? "border-b border-white/10" : "",
              ].join(" ")}
            >
              <Icon size={20} className="text-cream" />
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
