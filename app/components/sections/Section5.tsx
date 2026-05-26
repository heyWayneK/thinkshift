import Image from "next/image";

export default function Section5() {
  return (
    <section
      id="cta"
      className="relative isolate flex min-h-screen w-full overflow-hidden  border-x-16 border-y-8  md:border-x-33 md:border-y-17 lg:border-x-100 lg:border-t-100  border-white px-6 py-12 text-black sm:px-12 lg:px-20"
    >
      <Image
        src="/bg_section_4.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="relative flex w-full flex-col">
        <div className="flex justify-end">
          <div className="flex max-w-md items-start gap-4 rounded-md bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-7">
            <Image
              src="/arrow.svg"
              alt=""
              width={54}
              height={86}
              className="mt-1 h-10 w-auto shrink-0 sm:h-12"
            />
            <p className="text-base leading-snug text-black sm:text-lg">
              Together, we turn a{" "}
              <strong className="font-bold">back-of-a-napkin concept</strong>{" "}
              into a high-revenue, systems-driven business.
            </p>
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-12">
          <video
            src="/lets_build_your_business_compressed.mp4"
            width={339}
            height={193}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="Let's build your business together"
            className="h-auto w-40 mix-blend-lighten sm:w-52 lg:w-64"
          />
        </div>
      </div>
    </section>
  );
}
