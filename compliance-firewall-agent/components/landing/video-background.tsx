"use client";

import { useRef } from "react";

interface VideoBackgroundProps {
  src: string;
  fallbackImage?: string;
  overlayOpacity?: number;
  className?: string;
}

export function VideoBackground({
  src,
  fallbackImage,
  overlayOpacity = 0.6,
  className = "",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={`absolute inset-0 overflow-hidden w-full h-full pointer-events-none ${className}`}>
      {/* Fallback image or loading state if needed */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={fallbackImage}
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-80 mix-blend-screen"
        style={{ objectPosition: "center" }}
      >
        <source src={src} type="video/mp4" />
      </video>
      
      {/* Gradient Overlay for Text Readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Radial fade for edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
