"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

// Per-tile stagger in ms. Title fires first, then 1..10 sequentially, then
// the engine tile last so the eye lands on the CTA at the end.
const STAGGER_MS = 110;

function ScreenTile({
  bg,
  alt,
  visible,
  delay,
  children,
}: {
  bg: string;
  alt: string;
  visible: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative aspect-[349/226] w-full transform-gpu transition-[opacity,transform,filter] duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-6 blur-sm"
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      <Image
        src={bg}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-contain"
      />
      <div className="absolute inset-0 flex items-center justify-center px-3 text-center sm:px-4">
        {children}
      </div>
    </div>
  );
}

function TileContent({ tile }: { tile: Tile }) {
  if (tile.kind === "title") {
    return (
      <div className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
        {tile.lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    );
  }
  if (tile.kind === "engine") {
    return (
      <div className="text-base font-extrabold uppercase leading-tight tracking-tight text-white sm:text-lg lg:text-xl">
        <div>+&nbsp;Business-</div>
        <div>in-a-Box</div>
        <div>Growth Engine</div>
      </div>
    );
  }
  return (
    <div className="text-lg font-extrabold uppercase leading-tight tracking-tight text-[#c4e600] sm:text-xl lg:text-2xl">
      <div>{tile.n}.</div>
      {tile.lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
}

export default function Section4() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    // Honour OS-level reduced-motion: show everything instantly, no stagger.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            return;
          }
        }
      },
      // Fire once ~25% of the grid is on screen so the animation lands while
      // the section is already mostly in view (not at the very bottom edge).
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="journey"
      className="relative isolate flex min-h-screen w-full items-center overflow-hidden border-x-[33px] border-y-[17px] border-black px-6 py-16 sm:px-12 lg:px-20"
    >
      <Image
        src="/bg_section_3.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/15" />

      <div
        ref={gridRef}
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:gap-6"
      >
        {TILES.map((t, i) => {
          const bg =
            t.kind === "title"
              ? "/black_screen.svg"
              : t.kind === "engine"
                ? "/purple_screen.svg"
                : "/green_screen.svg";
          const alt =
            t.kind === "title"
              ? "The Journey"
              : t.kind === "engine"
                ? "Business-in-a-box growth engine"
                : `Step ${t.n}`;
          return (
            <ScreenTile
              key={i}
              bg={bg}
              alt={alt}
              visible={visible}
              delay={i * STAGGER_MS}
            >
              <TileContent tile={t} />
            </ScreenTile>
          );
        })}
      </div>
    </section>
  );
}
