"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  /** Element tag to render the text in */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  /** Highlight color class e.g. "text-brand-400" */
  highlightClass?: string;
}

/**
 * Word-by-word scroll-reveal — each word fades+slides in as the section
 * scrolls into view. Inspired by Terminal Industries typography.
 */
export function TextReveal({
  text,
  className = "",
  as: Tag = "p",
  highlightClass = "text-white",
}: TextRevealProps) {
  const words = text.split(" ");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "start 0.25"],
  });

  return (
    <div ref={containerRef}>
      <Tag className={className}>
        {words.map((word, i) => {
          const start = i / words.length;
          const end = (i + 1) / words.length;
          return (
            <Word
              key={i}
              progress={scrollYProgress}
              range={[start, end]}
              highlightClass={highlightClass}
            >
              {word}
            </Word>
          );
        })}
      </Tag>
    </div>
  );
}

function Word({
  children,
  progress,
  range,
  highlightClass,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
  highlightClass: string;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);

  return (
    <motion.span
      style={{ opacity, y }}
      className={`inline-block mr-[0.25em] ${highlightClass} will-change-transform`}
    >
      {children}
    </motion.span>
  );
}

/** Simple masked line reveal — cinematic single-line reveal */
export function LineReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "110%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}
