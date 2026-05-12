"use client";

import { useState, useCallback } from "react";

/**
 * Wraps any section with a cursor-tracked radial spotlight.
 * The gradient is calculated relative to the section — works at any scroll position.
 */
export function SectionSpotlight({
  children,
  className = "",
  color = "rgba(99,102,241,0.09)",
  radius = 500,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  radius?: number;
  as?: React.ElementType;
}) {
  const [spot, setSpot] = useState({ x: "50%", y: "-100px", visible: false });

  const handleMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({ x: `${e.clientX - rect.left}px`, y: `${e.clientY - rect.top}px`, visible: true });
  }, []);

  const handleLeave = useCallback(() => {
    setSpot((s) => ({ ...s, visible: false }));
  }, []);

  return (
    <Tag className={`relative ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {/* Spotlight overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{
          opacity: spot.visible ? 1 : 0,
          background: `radial-gradient(${radius}px circle at ${spot.x} ${spot.y}, ${color}, transparent 40%)`,
        }}
      />
      {children}
    </Tag>
  );
}
