"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { PlayerRef } from "@remotion/player";
import { BarLineChart } from "./BarLineChart";

// SSR-safe — Remotion Player uses browser APIs
const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false }
);

export function BarLineChartPlayer() {
  const ref = useRef<PlayerRef>(null);

  useEffect(() => {
    ref.current?.play();
  }, []);

  return (
    <Player
      ref={ref}
      component={BarLineChart}
      durationInFrames={120}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      loop
      controls={false}
      style={{ width: "100%", borderRadius: "12px", display: "block" }}
    />
  );
}
