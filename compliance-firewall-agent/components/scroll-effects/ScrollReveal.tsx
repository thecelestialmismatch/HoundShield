"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

type Variant = { initial: TargetAndTransition; animate: TargetAndTransition };

const VARIANTS: Record<Direction, Variant> = {
  up:    { initial: { opacity: 0, y: 48 },  animate: { opacity: 1, y: 0 } },
  down:  { initial: { opacity: 0, y: -48 }, animate: { opacity: 1, y: 0 } },
  left:  { initial: { opacity: 0, x: -48 }, animate: { opacity: 1, x: 0 } },
  right: { initial: { opacity: 0, x: 48 },  animate: { opacity: 1, x: 0 } },
  none:  { initial: { opacity: 0 },         animate: { opacity: 1 } },
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.75,
  once = true,
}: ScrollRevealProps) {
  const { initial, animate } = VARIANTS[direction];

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger children with sequential delays */
export function ScrollRevealGroup({
  children,
  className = "",
  stagger = 0.1,
  direction = "up",
}: {
  children: ReactNode[];
  className?: string;
  stagger?: number;
  direction?: Direction;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * stagger} direction={direction}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
