"use client";

import { useRef, useEffect } from "react";

const DESC =
  "A compliance firewall fixed between AI and breach. An exploration of privacy, security, and silence in regulated space.";

export function KaelusAboutV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
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
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#010828]/50" />

      {/* Content */}
      <div className="relative z-10 max-w-[1831px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20 lg:py-24 min-h-screen flex flex-col justify-center">
        {/* Top row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* Left: heading with cursive overlay */}
          <div className="relative">
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
          </div>

          {/* Right: description */}
          <p className="font-mono text-[14px] sm:text-[16px] uppercase text-cream max-w-[266px]">
            {DESC}
          </p>
        </div>

        {/* Bottom row — decorative low-opacity text */}
        <div className="flex justify-between mt-16 lg:mt-24">
          <div className="flex flex-col gap-4 max-w-[300px]">
            <p className="font-mono text-[14px] uppercase text-cream opacity-10">{DESC}</p>
            <p className="font-mono text-[14px] uppercase text-cream opacity-10">{DESC}</p>
          </div>
          <div className="hidden lg:flex flex-col gap-4 max-w-[300px]">
            <p className="font-mono text-[14px] uppercase text-[#010828] opacity-10">{DESC}</p>
            <p className="font-mono text-[14px] uppercase text-[#010828] opacity-10">{DESC}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
