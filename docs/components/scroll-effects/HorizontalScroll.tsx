"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

interface HorizontalScrollProps {
  /** Each child becomes one full-screen panel */
  panels: ReactNode[];
  className?: string;
  /** Label shown in the progress indicator */
  label?: string;
}

/**
 * Terminal Industries–style sticky horizontal scroll.
 * The container is tall (panels.length * 100vh) so natural scroll
 * drives the sticky viewport's horizontal track left-to-right.
 */
export function HorizontalScroll({ panels, className = "", label }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Translate from 0 to -(panels-1)*100vw
  const xPercent = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `${-(panels.length - 1) * 100}vw`]
  );

  const activeIndex = useTransform(scrollYProgress, [0, 1], [0, panels.length - 1]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: `${panels.length * 100}vh` }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Progress dots */}
        <PanelDots count={panels.length} progress={scrollYProgress} label={label} />

        {/* Horizontal track */}
        <motion.div
          className="flex h-full"
          style={{ x: xPercent, width: `${panels.length * 100}vw` }}
        >
          {panels.map((panel, i) => (
            <div key={i} className="w-screen h-full flex-shrink-0">
              {panel}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function PanelDot({ progress, count, index }: {
  progress: MotionValue<number>;
  count: number;
  index: number;
}) {
  const dotProgress = useTransform(
    progress,
    [(index - 0.5) / count, index / count, (index + 0.5) / count],
    [0, 1, 0]
  );
  const scale = useTransform(dotProgress, [0, 1], [1, 1.6]);
  const opacity = useTransform(dotProgress, [0, 1], [0.3, 1]);
  return (
    <motion.div
      style={{ scale, opacity }}
      className="w-1.5 h-1.5 rounded-full bg-brand-400 will-change-transform"
    />
  );
}

function PanelDots({
  count,
  progress,
  label,
}: {
  count: number;
  progress: MotionValue<number>;
  label?: string;
}) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <PanelDot key={i} progress={progress} count={count} index={i} />
        ))}
      </div>
    </div>
  );
}

/** Scroll progress bar at top of page */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] z-[200] origin-left bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300 will-change-transform"
    />
  );
}
