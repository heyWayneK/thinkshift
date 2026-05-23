"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative full-bleed video that sits behind the hero as a low-opacity layer.
 * The center is kept clear (see globals.css) so the hero stays the focal point.
 * Respects prefers-reduced-motion by leaving the static poster in place.
 */
export default function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Accessible users keep the static poster frame, no motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // iOS/Safari only autoplay video that is muted + inline. React doesn't
    // reliably reflect the `muted` prop to the DOM, so force it imperatively
    // before attempting playback — otherwise play() rejects on mobile.
    video.muted = true;

    const play = () => {
      void video.play().catch(() => {
        /* still blocked (e.g. iOS Low Power Mode) — poster frame remains */
      });
    };

    play();
    // If the data wasn't buffered yet, retry as soon as it can play.
    video.addEventListener("canplay", play, { once: true });
    return () => video.removeEventListener("canplay", play);
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
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="hero-bg__scrim absolute inset-0" />
    </div>
  );
}
