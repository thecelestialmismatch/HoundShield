"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Vanta-style cursor:
 * - Small sharp dot tracking cursor exactly
 * - Larger ring following with spring lag
 * - Global ambient glow that moves lazily
 * - Sets CSS vars --mx/--my on :root for section spotlights
 * - Only active on pointer-fine (desktop) devices
 */
export function CursorGlow() {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  // Sharp dot — snappy
  const dotX = useSpring(mouseX, { stiffness: 900, damping: 45 });
  const dotY = useSpring(mouseY, { stiffness: 900, damping: 45 });

  // Ring — slight lag
  const ringX = useSpring(mouseX, { stiffness: 200, damping: 22 });
  const ringY = useSpring(mouseY, { stiffness: 200, damping: 22 });

  // Ambient glow — very lazy
  const glowX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const visibleRef = useRef(false);

  useEffect(() => {
    // Only enable on pointer-fine (mouse) devices
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      // CSS vars for section spotlights
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);

      if (!visibleRef.current) {
        visibleRef.current = true;
        document.documentElement.classList.add("cursor-active");
      }
    };

    const leave = () => {
      document.documentElement.classList.remove("cursor-active");
      visibleRef.current = false;
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Ambient glow — large, lazy, behind everything */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-0 rounded-full opacity-0 cursor-active:opacity-100"
        style={{
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.04) 35%, transparent 70%)",
        }}
      />

      {/* Ring */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9998] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: 34,
          height: 34,
          border: "1px solid rgba(255,255,255,0.18)",
          mixBlendMode: "difference",
        }}
      />

      {/* Dot */}
      <motion.div
        aria-hidden="true"
        className="fixed pointer-events-none z-[9999] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 5,
          height: 5,
          backgroundColor: "white",
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
