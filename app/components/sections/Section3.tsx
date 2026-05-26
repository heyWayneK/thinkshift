import Image from "next/image";

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

function Pillar({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: "dark" | "light";
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
        {items.map((it) => (
          <div
            key={it}
            className="rounded-full bg-white/15 px-5 py-2 text-center text-xs font-semibold uppercase tracking-wide text-black shadow-sm backdrop-blur-sm sm:py-2.5 sm:text-sm max-w-max"
          >
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Section3() {
  return (
    <section
      id="match"
      className="relative isolate flex min-h-screen w-full overflow-hidden border-x-[33px] border-y-[17px] border-black px-6 py-12 text-black sm:px-12 lg:px-20"
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
          <Pillar label="You Bring" items={YOU_BRING} variant="dark" />
          <Pillar label="We Bring" items={WE_BRING} variant="light" />
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
