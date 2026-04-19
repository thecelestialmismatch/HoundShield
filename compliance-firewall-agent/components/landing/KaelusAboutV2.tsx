"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const DESC =
  "A compliance firewall fixed between AI and breach. An exploration of privacy, security, and silence in regulated space.";

const ease = [0.16, 1, 0.3, 1] as const;

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

export function KaelusAboutV2() {
  const videoRef = useLazyVideo();

  return (
    <section className="relative min-h-screen overflow-hidden noise-overlay">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-[#010828]/50" />

      <div className="relative z-10 max-w-[1831px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20 lg:py-24 min-h-screen flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* Left: heading */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease }}
          >
            <span
              className="
                absolute -bottom-4 right-0 translate-x-4
                font-condiment text-neon normal-case
                text-[36px] sm:text-[52px] lg:text-[68px]
                mix-blend-exclusion opacity-90 select-none -rotate-[4deg]
              "
            >
              Kaelus
            </span>
            <h2
              className="
                font-grotesk uppercase text-cream
                text-[32px] sm:text-[48px] lg:text-[60px]
                leading-[1]
              "
            >
              Hello!
              <br />
              I&apos;m Kaelus
            </h2>
          </motion.div>

          {/* Right: description */}
          <motion.p
            className="font-mono text-[14px] sm:text-[16px] uppercase text-cream max-w-[266px]"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
          >
            {DESC}
          </motion.p>
        </div>

        {/* Decorative bottom rows */}
        <motion.div
          className="flex justify-between mt-16 lg:mt-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <div className="flex flex-col gap-4 max-w-[300px]">
            <p className="font-mono text-[14px] uppercase text-cream opacity-10">{DESC}</p>
            <p className="font-mono text-[14px] uppercase text-cream opacity-10">{DESC}</p>
          </div>
          <div className="hidden lg:flex flex-col gap-4 max-w-[300px]">
            <p className="font-mono text-[14px] uppercase text-[#010828] opacity-10">{DESC}</p>
            <p className="font-mono text-[14px] uppercase text-[#010828] opacity-10">{DESC}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
