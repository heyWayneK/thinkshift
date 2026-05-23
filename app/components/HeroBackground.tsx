"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative full-bleed video that sits behind the hero as a low-opacity layer.
 * A radial mask keeps the center of the screen clear so the hero content stays
 * the focal point — the city scene only bleeds in around the edges/corners.
 * Honors prefers-reduced-motion by leaving the poster frame in place.
 */
export default function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return; // keep the static poster, don't autoplay

    video.play().catch(() => {
      /* autoplay blocked by the browser — poster frame remains */
    });
  }, []);

  return (
    <div
      aria-hidden
      className="hero-bg pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-screen -translate-x-1/2 select-none overflow-hidden"
    >
      <video
        ref={videoRef}
        className="hero-bg__video h-full w-full object-cover"
        poster="/background-thumbnail.jpg"
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="hero-bg__scrim absolute inset-0" />
    </div>
  );
}
