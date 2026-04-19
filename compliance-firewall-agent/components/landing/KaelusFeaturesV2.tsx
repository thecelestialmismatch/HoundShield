"use client";

import { useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface CardData {
  id: string;
  src: string;
  label: string;
  score: string;
}

const CARDS: CardData[] = [
  {
    id: "soc2",
    src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4",
    label: "SOC 2 MODULE",
    score: "98.7/100",
  },
  {
    id: "hipaa",
    src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4",
    label: "HIPAA SHIELD",
    score: "99/100",
  },
  {
    id: "cmmc",
    src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4",
    label: "CMMC LEVEL 2",
    score: "96.2/100",
  },
];

function VideoCard({ card }: { card: CardData }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition-colors duration-300 cursor-pointer">
      {/* Square video via padding-bottom trick */}
      <div className="relative pb-[100%] rounded-[24px] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={card.src} type="video/mp4" />
        </video>

        {/* Score overlay bar */}
        <div className="absolute bottom-3 left-3 right-3 liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-cream/70 font-grotesk uppercase tracking-wider">
              {card.label}
            </p>
            <p className="text-[16px] text-cream font-grotesk mt-0.5">{card.score}</p>
          </div>
          <button
            aria-label={`View ${card.label}`}
            className="
              w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center
              bg-gradient-to-br from-[#b724ff] to-[#7c3aed]
              shadow-lg shadow-purple-500/50
              hover:scale-110 transition-transform duration-200
            "
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function KaelusFeaturesV2() {
  return (
    <section className="bg-[#010828] py-20 lg:py-28">
      <div className="max-w-[1831px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 lg:mb-16">
          {/* Title */}
          <h2 className="font-grotesk uppercase text-cream text-[32px] sm:text-[48px] lg:text-[60px] leading-[1.05]">
            Collection of
            <br />
            <span className="ml-12 sm:ml-24 lg:ml-32 inline-flex items-baseline gap-3">
              <span className="font-condiment text-neon normal-case text-[36px] sm:text-[52px] lg:text-[64px] -rotate-1 inline-block">
                Shield
              </span>
              <span className="font-grotesk">modules</span>
            </span>
          </h2>

          {/* See all button */}
          <div className="group cursor-pointer">
            <div className="flex items-end gap-2">
              <span className="font-grotesk text-[32px] sm:text-[48px] lg:text-[60px] uppercase text-cream">
                SEE
              </span>
              <div className="flex flex-col items-start mb-2 sm:mb-3 lg:mb-4">
                <span className="font-grotesk text-[20px] sm:text-[28px] lg:text-[36px] uppercase text-cream leading-none">
                  ALL
                </span>
                <span className="font-grotesk text-[20px] sm:text-[28px] lg:text-[36px] uppercase text-cream leading-none">
                  MODULES
                </span>
              </div>
            </div>
            <div className="h-[6px] sm:h-[8px] lg:h-[10px] bg-neon w-full mt-1 group-hover:scale-x-110 transition-transform duration-200 origin-left" />
          </div>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((card) => (
            <VideoCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
