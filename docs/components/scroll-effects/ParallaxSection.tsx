"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  /** How far (in px) background moves relative to scroll. Positive = up, negative = down. */
  speed?: number;
  /** Offset range within viewport [enter, leave]. Defaults to full viewport traversal. */
  inputRange?: [number, number];
}

/** Wraps content with a parallax-shifted background layer.
 *  The children scroll at normal speed; the container itself shifts. */
export function ParallaxSection({
  children,
  className = "",
  speed = 80,
  inputRange = [0, 1],
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, inputRange, [speed, -speed]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/** Parallax floating element — drifts independently of section scroll */
export function ParallaxFloat({
  children,
  className = "",
  speed = 40,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={`will-change-transform ${className}`}>
      {children}
    </motion.div>
  );
}
