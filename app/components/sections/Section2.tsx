import Image from "next/image";
import LetsBuildAnimated from "../LetsBuildAnimated";

export default function Section2() {
  return (
    <section
      id="start"
      className="relative isolate flex min-h-screen w-full flex-col justify-between overflow-hidden border-x-16 border-t-16 border-b-8 md:border-x-33 md:border-t-33 lg:border-x-100 lg:border-t-100 md:border-b-17 border-white px-6 py-12 text-white sm:px-12 lg:px-20"
    >
      <Image
        src="/bg_section_1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/15" />

      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-5xl items-center justify-center gap-2 sm:gap-6">
          <a
            href="#apply"
            aria-label="Start — pitch your concept"
            className="block shrink-0 transition-transform duration-200 hover:scale-105 hover:drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          >
            <Image
              src="/Start-3d-black.svg"
              alt="Start"
              width={283}
              height={438}
              className="h-auto w-20 sm:w-56 lg:w-72"
              priority
            />
          </a>

          <LetsBuildAnimated className="h-auto w-56 sm:w-80 lg:w-[28rem]" />
        </div>
      </div>

      <div className="text-left">
        <Image
          src="/business_in_a_box_plus_growth_bid_white.png"
          alt="+ Business-in-a-box growth engine"
          width={1139}
          height={163}
          priority
          sizes="(max-width: 768px) 90vw, (max-width: 1280px) 80vw, 1200px"
          className="h-auto w-full max-w-5xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]"
        />
      </div>
    </section>
  );
}
