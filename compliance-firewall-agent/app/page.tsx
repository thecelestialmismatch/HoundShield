"use client";

import { KaelusHeroV2 } from "@/components/landing/KaelusHeroV2";
import { KaelusAboutV2 } from "@/components/landing/KaelusAboutV2";
import { KaelusFeaturesV2 } from "@/components/landing/KaelusFeaturesV2";
import { KaelusCTAV2 } from "@/components/landing/KaelusCTAV2";

export default function LandingPage() {
  return (
    <div className="bg-[#010828] min-h-screen">
      {/* Section 1 — Hero: full-viewport video + embedded nav */}
      <KaelusHeroV2 />

      {/* Section 2 — About: full-viewport video + intro copy */}
      <KaelusAboutV2 />

      {/* Section 3 — Features: solid bg, 3-card compliance grid */}
      <KaelusFeaturesV2 />

      {/* Section 4 — CTA: native-ratio video + signal copy */}
      <KaelusCTAV2 />
    </div>
  );
}
