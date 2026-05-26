import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import ApplyForm from "./components/ApplyForm";
import Section1 from "./components/sections/Section1";
import Section2 from "./components/sections/Section2";
import Section3 from "./components/sections/Section3";
import Section4 from "./components/sections/Section4";
import Section5 from "./components/sections/Section5";
import Section6 from "./components/sections/Section6";

const CONTACT = "#apply";

function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/thinkshift_logo_white.svg"
      alt="ThinkShift"
      width={1071}
      height={203}
      priority
      className={className}
    />
  );
}

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="relative flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="h-7 w-auto" />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a
              href="#start"
              className="transition-colors hover:text-foreground"
            >
              Start
            </a>
            <a
              href="#match"
              className="transition-colors hover:text-foreground"
            >
              The Match
            </a>
            <a
              href="#journey"
              className="transition-colors hover:text-foreground"
            >
              The Journey
            </a>
            <a
              href="#quote"
              className="transition-colors hover:text-foreground"
            >
              Why
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={userId ? "/dashboard" : "/sign-in"}
              className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block"
            >
              {userId ? "Dashboard" : "Sign in"}
            </Link>
            <a
              href={CONTACT}
              className="btn-primary rounded-lg px-4 py-2 text-sm"
            >
              Pitch Your Concept
            </a>
          </div>
        </div>
      </header>

      <main className="relative flex flex-col bg-white">
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
        <Section6 />
        {/* <Section1 /> */}

        <section
          id="apply"
          className="bg-aura relative scroll-mt-24 border-x-[33px] border-y-[17px] border-black px-2 py-20 lg:py-28"
        >
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-3xl ">
            <div className="card relative overflow-hidden p-1 text-center sm:p-16 ">
              <div className="bg-aura pointer-events-none absolute inset-0 opacity-70" />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl text-black ">
                  We bring the growth engine. You bring the market.{" "}
                  <span className="text-gradient">Let&apos;s build.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
                  If you are ready to match our execution velocity and dominate
                  your niche space, let&apos;s talk.
                </p>
                <ApplyForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <Logo className="h-6 w-auto opacity-80" />
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} ThinkShift. Joint ventures, not client
            work.
          </p>
        </div>
      </footer>
    </div>
  );
}
