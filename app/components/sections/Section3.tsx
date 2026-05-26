"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const YOU_BRING = [
  "Business Idea",
  "Niche Market",
  "Deep Experience",
  "Access to Niche",
];
const WE_BRING = [
  "CTO & Co-Founder",
  "Technical Backbone",
  "Marketing Setup",
  "Technical-Marketing",
];

// Typing speed per character. The pills are short (~12–19 chars), so a 45ms
// cadence keeps each pill under a second while still reading as "typed".
const CHAR_DELAY = 45;
// Stagger between pills inside the same pillar (top → bottom).
const PILL_STAGGER = 250;
// Gap after the YOU BRING pillar finishes before WE BRING starts typing.
const PILLAR_GAP = 350;

function Pill({
  text,
  startDelay,
  playId,
}: {
  text: string;
  startDelay: number;
  playId: number;
}) {
  // SSR / no-JS visitors see the full text. The effect only clears + replays
  // once playId increments (i.e. when the section observer fires).
  const [typed, setTyped] = useState(text);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Initial mount uses playId === 0 — don't animate, leave the SSR text
    // in place. The section's observer drives the first real play.
    if (playId === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: never clear / type. Leave the full text visible.
      return;
    }

    let typeTimer: number | null = null;
    // Defer the initial clear into a macrotask so the setState is outside
    // the effect body (avoids react-hooks/set-state-in-effect).
    const startTimer = window.setTimeout(() => {
      setTyped("");
      setTyping(true);
      let i = 0;
      const tick = () => {
        i++;
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          setTyping(false);
          typeTimer = null;
          return;
        }
        typeTimer = window.setTimeout(tick, CHAR_DELAY);
      };
      typeTimer = window.setTimeout(tick, 0);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimer);
      if (typeTimer !== null) window.clearTimeout(typeTimer);
    };
  }, [playId, text, startDelay]);

  return (
    <div className="max-w-max rounded-full bg-white/15 px-5 py-2 text-center text-xs font-semibold uppercase tracking-wide text-black shadow-sm backdrop-blur-sm sm:py-2.5 sm:text-sm">
      {typed || " " /* &nbsp; keeps height while empty */}
      {typing && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[0.9em] w-[0.4em] animate-cursor bg-current align-text-bottom"
        />
      )}
    </div>
  );
}

function Pillar({
  label,
  items,
  variant,
  baseDelay,
  playId,
}: {
  label: string;
  items: string[];
  variant: "dark" | "light";
  baseDelay: number;
  playId: number;
}) {
  const badge =
    variant === "dark"
      ? "bg-black text-white"
      : "bg-white text-black border border-black/10";

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div
        className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full text-center text-[11px] font-bold uppercase leading-tight tracking-wide shadow-md sm:h-24 sm:w-24 sm:text-xs ${badge}`}
      >
        {label.split(" ").map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 sm:gap-3">
        {items.map((it, i) => (
          <Pill
            key={it}
            text={it}
            startDelay={baseDelay + i * PILL_STAGGER}
            playId={playId}
          />
        ))}
      </div>
    </div>
  );
}

export default function Section3() {
  const ref = useRef<HTMLElement>(null);
  // playId increments every time the section enters the viewport, which
  // re-triggers the per-pill typewriter effects. Starts at 0 so the SSR
  // text stays put until the observer fires the first real play.
  const [playId, setPlayId] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let inView = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          inView = true;
          setPlayId((id) => id + 1);
        } else if (!entry.isIntersecting && inView) {
          inView = false;
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // WE BRING starts after YOU BRING finishes its last pill animation plus a
  // small breath gap, so the two pillars feel sequenced rather than racing.
  const youBringTotal =
    (YOU_BRING.length - 1) * PILL_STAGGER +
    Math.max(...YOU_BRING.map((s) => s.length)) * CHAR_DELAY;
  const weBringBase = youBringTotal + PILLAR_GAP;

  return (
    <section
      ref={ref}
      id="match"
      className="relative isolate flex min-h-screen w-full overflow-hidden  border-x-16 border-y-8  md:border-x-33 md:border-y-17 lg:border-x-100 lg:border-t-100  border-white px-6 py-12 text-black sm:px-12 lg:px-20"
    >
      <Image
        src="/bg_section_2.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />

      <div className="relative flex w-full flex-col">
        <h2 className="max-w-xl text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl lg:text-4xl">
          Been looking for a way to launch your business idea?
        </h2>

        <div className="mt-10 flex flex-1 flex-col justify-center gap-10 sm:max-w-xl sm:gap-14">
          <Pillar
            label="You Bring"
            items={YOU_BRING}
            variant="dark"
            baseDelay={0}
            playId={playId}
          />
          <Pillar
            label="We Bring"
            items={WE_BRING}
            variant="light"
            baseDelay={weBringBase}
            playId={playId}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Image
            src="/lets_build_your_business_straight_black.svg"
            alt="Let's build your business together"
            width={339}
            height={193}
            className="h-auto w-40 sm:w-52 lg:w-64"
          />
        </div>
      </div>
    </section>
  );
}
