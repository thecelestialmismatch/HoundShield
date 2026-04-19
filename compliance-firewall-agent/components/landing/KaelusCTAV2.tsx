"use client";

import { useRef, useEffect } from "react";
import { Mail, Twitter, Github } from "lucide-react";

const SOCIAL = [
  { icon: Mail, href: "mailto:hello@kaelus.online", label: "Email" },
  { icon: Twitter, href: "https://twitter.com/kaelusonline", label: "Twitter" },
  { icon: Github, href: "https://github.com/kaelus-online", label: "GitHub" },
];

export function KaelusCTAV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Video at native aspect ratio — NOT object-cover */}
      <video
        ref={videoRef}
        autoPlay
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

      {/* Text overlay — right-aligned, desktop offset */}
      <div className="absolute inset-0 flex items-center justify-end lg:pr-[20%] lg:pl-[15%] px-6">
        <div className="relative text-right">
          {/* "Go beyond" cursive — positioned at top-left of block */}
          <span
            className="
              absolute -top-6 sm:-top-12 lg:-top-20 left-0
              font-condiment text-neon normal-case
              text-[17px] sm:text-[36px] lg:text-[68px]
              mix-blend-exclusion select-none
            "
          >
            Go beyond
          </span>

          <h2
            className="
              font-grotesk uppercase text-cream
              text-[16px] sm:text-[32px] lg:text-[60px]
              leading-[1.05]
            "
          >
            <span className="block mb-4 sm:mb-8 lg:mb-12">ACTIVATE NOW.</span>
            <span className="block">GUARD WHAT&apos;S HIDDEN.</span>
            <span className="block">COMPLY WITHOUT FRICTION.</span>
            <span className="block">FOLLOW THE SIGNAL.</span>
          </h2>
        </div>
      </div>

      {/* Social icons — bottom-left absolute */}
      <div className="absolute left-[8%] bottom-[12%] sm:bottom-[16%] lg:bottom-[20%]">
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
      </div>
    </section>
  );
}
