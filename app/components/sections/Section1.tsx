import Image from "next/image";

export default function Section1() {
  return (
    <section
      id="intro"
      className="relative isolate flex min-h-screen w-full flex-col  border-x-16 border-y-8  md:border-x-33 md:border-y-17 lg:border-x-100 lg:border-t-100  border-white bg-white px-6 py-10 text-black sm:px-12 lg:px-20"
    >
      <div className="flex justify-end">
        <Image
          src="/business_in_a_box_plus_growth_small_black.svg"
          alt="Business-in-a-box + Growth Engine"
          width={361}
          height={50}
          className="h-10 w-auto sm:h-12"
          priority
        />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Image
          src="/Start_lets_build_group_black.svg"
          alt="Start — Let's build your business together"
          width={775}
          height={454}
          className="h-auto w-full max-w-[820px]"
          priority
        />
      </div>

      <div className="flex justify-end">
        <Image
          src="/lets_build_your_business_straight_black.svg"
          alt="Let's build your business together"
          width={339}
          height={193}
          className="h-auto w-40 sm:w-52 lg:w-64"
        />
      </div>
    </section>
  );
}
