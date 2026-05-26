"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Tile =
  | { kind: "title"; lines: string[] }
  | { kind: "step"; n: number; lines: string[] }
  | { kind: "engine" };

const TILES: Tile[] = [
  { kind: "title", lines: ["The", "Journey"] },
  { kind: "step", n: 1, lines: ["Unpack the", "Idea"] },
  { kind: "step", n: 2, lines: ["Build", "Brand"] },
  { kind: "step", n: 3, lines: ["Develop", "the App"] },
  { kind: "step", n: 4, lines: ["Generate", "Public", "Website"] },
  { kind: "step", n: 5, lines: ["Technical", "Marketing"] },
  { kind: "step", n: 6, lines: ["Launch", "Marketing"] },
  { kind: "step", n: 7, lines: ["Daily", "Management"] },
  { kind: "step", n: 8, lines: ["Defending", "the Brand"] },
  { kind: "step", n: 9, lines: ["Growth", "Management"] },
  { kind: "step", n: 10, lines: ["Ongoing", "Innovation"] },
  { kind: "engine" },
];

function buildFullText(tile: Tile): string {
  if (tile.kind === "title") return tile.lines.join("\n");
  if (tile.kind === "engine") return "+ Business-\nin-a-Box\nGrowth Engine";
  return `${tile.n}.\n${tile.lines.join("\n")}`;
}

// Per-tile typing speed so the section reads like 12 terminals booting in
// sequence, each with its own rhythm. Title snaps quickly to anchor the eye;
// the engine CTA lands slower for emphasis; numbered steps in between.
function charDelayFor(tile: Tile): number {
  if (tile.kind === "title") return 38;
  if (tile.kind === "engine") return 55;
  return 45;
}

function tileBg(tile: Tile): string {
  if (tile.kind === "title") return "/black_screen.svg";
  if (tile.kind === "engine") return "/purple_screen.svg";
  return "/green_screen.svg";
}

function tileAlt(tile: Tile): string {
  if (tile.kind === "title") return "The Journey";
  if (tile.kind === "engine") return "Business-in-a-box growth engine";
  return `Step ${tile.n}`;
}

function tileTextClass(tile: Tile): string {
  if (tile.kind === "title") {
    return "text-base font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl";
  }
  if (tile.kind === "engine") {
    return "text-[9px] font-extrabold uppercase leading-tight tracking-tight text-white sm:text-lg lg:text-xl";
  }
  return "text-xs font-bold uppercase leading-tight tracking-tight text-[#c4e600] sm:text-xl lg:text-2xl md:font-extrabold";
}

function ScreenTile({ tile }: { tile: Tile }) {
  const ref = useRef<HTMLDivElement>(null);
  const full = useMemo(() => buildFullText(tile), [tile]);
  const charDelay = useMemo(() => charDelayFor(tile), [tile]);

  // SSR and no-JS visitors get the full text. On client mount the effect
  // clears it; the IntersectionObserver then replays the typewriter every
  // time the tile re-enters the viewport.
  const [typed, setTyped] = useState(full);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion users skip the typewriter entirely. The SSR-initial
    // `typed = full` state stays untouched — no setState in the effect body
    // (avoids the react-hooks/set-state-in-effect lint trap) and no observer
    // is installed.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let inView = false;
    let timer: number | null = null;
    // Defer the initial clear into a macrotask so the setState happens
    // outside the effect body (lint-safe). Practically this still runs
    // before the user can see the tile if it's below the fold on load.
    const clearTimer = window.setTimeout(() => setTyped(""), 0);

    const play = () => {
      if (timer !== null) window.clearTimeout(timer);
      let i = 0;
      setTyped("");
      setTyping(true);
      const tick = () => {
        i++;
        setTyped(full.slice(0, i));
        if (i >= full.length) {
          setTyping(false);
          timer = null;
          return;
        }
        timer = window.setTimeout(tick, charDelay);
      };
      timer = window.setTimeout(tick, 0);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          inView = true;
          play();
        } else if (!entry.isIntersecting && inView) {
          inView = false;
        }
      },
      // Fire once 40% of the tile is on screen so the typing reads fully,
      // not in the user's peripheral vision at the edge of the viewport.
      { threshold: 0.4 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      window.clearTimeout(clearTimer);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [full, charDelay]);

  return (
    <div ref={ref} className="relative aspect-[349/226] w-full">
      <Image
        src={tileBg(tile)}
        alt={tileAlt(tile)}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-contain"
      />
      <div className="absolute inset-0 flex items-center justify-center px-3 text-center sm:px-4">
        <div className={`whitespace-pre-line ${tileTextClass(tile)}`}>
          {typed}
          {typing && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[1em] w-[0.55em] animate-cursor bg-current align-text-bottom"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Section4() {
  return (
    <section
      id="journey"
      className="relative isolate flex min-h-[90dvh] lg:min-h-[80dvh] w-full items-center overflow-hidden  border-x-16 border-y-8  md:border-x-33 md:border-y-17 lg:border-x-100 lg:border-t-100  border-white px-6 py-16 sm:px-12 lg:px-20"
    >
      <Image
        src="/bg_section_3.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/15" />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:gap-6">
        {TILES.map((t, i) => (
          <ScreenTile key={i} tile={t} />
        ))}
      </div>
    </section>
  );
}
