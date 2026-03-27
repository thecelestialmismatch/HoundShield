"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Vanta-style cursor:
 * - Small sharp dot tracking cursor exactly
 * - Larger ring following with spring lag
 * - Global ambient glow that moves lazily
 * - Fades in on first move, fades out when leaving window
 * - Sets CSS vars --mx/--my on :root for section spotlights
 * - Only active on pointer-fine (desktop) devices
 */
export function CursorGlow() {
  // Position — starts far off-screen so springs don't launch visibly
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Opacity as MotionValue — safe to use directly in useEffect (no stale closure)
  const visible = useMotionValue(0);
  const smoothVisible = useSpring(visible, { stiffness: 300, damping: 28 });

  // Sharp dot — snappy
  const dotX = useSpring(mouseX, { stiffness: 900, damping: 45 });
  const dotY = useSpring(mouseY, { stiffness: 900, damping: 45 });

  // Ring — slight lag
  const ringX = useSpring(mouseX, { stiffness: 200, damping: 22 });
  const ringY = useSpring(mouseY, { stiffness: 200, damping: 22 });

  // Ambient glow — very lazy
  const glowX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Scale the glow's base opacity (0.08) by visibility
  const glowOpacity = useTransform(smoothVisible, [0, 1], [0, 0.08]);

  useEffect(() => {
    // Only enable on pointer-fine (mouse) devices
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let hasMoved = false;

    const move = (e: MouseEvent) => {
      if (!hasMoved) {
        // Teleport springs to cursor position instantly on first move
        // so they don't spring from -1000
        mouseX.jump(e.clientX);
        mouseY.jump(e.clientY);
        hasMoved = true;
      } else {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
      visible.set(1);
    };

    const leave = () => visible.set(0);
    const enter = () => { if (hasMoved) visible.set(1); };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
    };
  }, [mouseX, mouseY, visible]);

  return (
    <>
      {/* Ambient glow — large, lazy, behind everything */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          width: 700,
          height: 700,
          opacity: glowOpacity,
          background:
            "radial-gradient(circle, rgba(99,102,241,1) 0%, rgba(99,102,241,0.4) 30%, transparent 70%)",
        }}
      />

      {/* Ring — spring lag */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9998] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: 36,
          height: 36,
          opacity: smoothVisible,
          border: "1.5px solid rgba(255,255,255,0.25)",
          mixBlendMode: "difference" as const,
        }}
      />

      {/* Dot — sharp */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9999] rounded-full bg-white"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 6,
          height: 6,
          opacity: smoothVisible,
          mixBlendMode: "difference" as const,
        }}
      />
    </>
  );
}
