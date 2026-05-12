"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Ambient cursor glow:
 * - Large lazy radial glow that follows the mouse
 * - Fades in on first move, fades out when leaving window
 * - Sets CSS vars --mx/--my on :root for section spotlights
 * - Only active on pointer-fine (desktop) devices
 * - Normal system cursor is preserved (no cursor: none)
 */
export function CursorGlow() {
  // Position — starts far off-screen so springs don't launch visibly
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Opacity as MotionValue — safe to use directly in useEffect (no stale closure)
  const visible = useMotionValue(0);
  const smoothVisible = useSpring(visible, { stiffness: 300, damping: 28 });

  // Ambient glow — very lazy
  const glowX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Scale the glow's base opacity (0.06) by visibility
  const glowOpacity = useTransform(smoothVisible, [0, 1], [0, 0.06]);

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
      {/* Ambient glow — large, lazy, sits behind all content */}
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
            "radial-gradient(circle, rgba(234,88,12,1) 0%, rgba(234,88,12,0.4) 30%, transparent 70%)",
        }}
      />
    </>
  );
}
