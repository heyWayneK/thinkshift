import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import HeroVisual from "./components/HeroVisual";
import ApplyForm from "./components/ApplyForm";

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
    <div className="bg-aura relative flex min-h-full flex-col">
      <div className="bg-grid pointer-events-none absolute inset-0" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="h-7 w-auto" />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#problem" className="transition-colors hover:text-foreground">
              The Problem
            </a>
            <a href="#solution" className="transition-colors hover:text-foreground">
              The Solution
            </a>
            <a href="#partners" className="transition-colors hover:text-foreground">
              Who We Build With
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

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted">
              <span className="animate-dot h-1.5 w-1.5 rounded-full bg-accent" />
              Business-in-a-box growth engine
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s build a business{" "}
              <span className="text-gradient">together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              You bring the industry depth and the niche community inroads.
              ThinkShift plugs in a complete business-in-a-box growth
              engine—handling 100% of the tech, engineering, custom platforms,
              and advanced go-to-market execution. Together, we turn a
              back-of-a-napkin concept into a high-revenue, systems-driven
              business.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={CONTACT}
                className="btn-primary rounded-xl px-6 py-3.5 text-base"
              >
                Pitch Your Concept &amp; Partner With Us
              </a>
              <a
                href="#solution"
                className="rounded-xl border border-white/10 px-6 py-3.5 text-base text-muted transition-colors hover:border-white/25 hover:text-foreground"
              >
                See how it works
              </a>
            </div>
          </div>
          <div className="lg:pl-4">
            <HeroVisual />
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="border-t border-white/5 py-20 lg:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            The missing engine
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The insight is brilliant. The execution is stuck.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">
            You know your market inside out. You see the gap, you have the
            credibility, and you have a community ready to buy. But going from a
            concept to a live, scalable operation requires a massive technical
            and marketing machine.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "Freelancers",
                d: "Deliver tasks, but lack the business vision to build an operation.",
              },
              {
                t: "Agencies",
                d: "Bill by the hour and drain cash long before traction.",
              },
              {
                t: "Traditional devs",
                d: "Ship code, but don't know how to run growth marketing.",
              },
            ].map((x) => (
              <div key={x.t} className="card p-6">
                <h3 className="text-lg font-semibold">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-xl font-medium">
            You don&apos;t need a supplier—you need an{" "}
            <span className="text-gradient">execution partner.</span>
          </p>
        </section>

        {/* Solution */}
        <section id="solution" className="border-t border-white/5 py-20 lg:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            The solution: ThinkShift
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The business-in-a-box growth engine
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">
            We don&apos;t do client work or pitch for fees. We invest our
            full-stack capabilities into shared joint ventures. We provide the
            entire backend, frontend, and growth infrastructure required to
            power your industry knowledge.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                t: "Full-Stack Engineering",
                d: "We architect the databases, design the custom user experiences, and build secure, rock-solid web and app systems.",
              },
              {
                t: "Advanced Go-To-Market",
                d: "Deep-link integrations into Google platforms, advanced SEO frameworks, and hyper-calibrated, multi-channel ad tech to acquire customers immediately.",
              },
              {
                t: "Built on Real Volume",
                d: 'A "full-stack founder" pedigree, built on the real-world experience of engineering and scaling operational businesses to over 1 million units a year.',
              },
            ].map((x, i) => (
              <div key={x.t} className="card p-7">
                <span className="font-mono text-sm text-accent">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{x.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partnership Profile */}
        <section id="partners" className="border-t border-white/5 py-20 lg:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Who we build with
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            We look for execution peers as committed to delivery as we are.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2">
            {[
              {
                t: "Deep Domain Leaders",
                d: "Elite, specialist knowledge of a niche market and direct roads to that community—podcasts, networks, trusted industry presence.",
              },
              {
                t: "Execution Obsessed",
                d: "You manage your time flawlessly, keep your word, and push hard to deliver.",
              },
              {
                t: "Customer-Centric",
                d: "You hold an uncompromising standard for customer service and operational excellence.",
              },
              {
                t: "Tech-Appreciative",
                d: "You respect the leverage of great automated systems, even if you don't build them yourself.",
              },
            ].map((x) => (
              <div key={x.t} className="bg-background p-7">
                <h3 className="text-lg font-semibold">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA + Apply */}
        <section id="apply" className="scroll-mt-24 py-20 lg:py-28">
          <div className="card relative overflow-hidden p-10 text-center sm:p-16">
            <div className="bg-aura pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                We bring the growth engine. You bring the market.{" "}
                <span className="text-gradient">Let&apos;s build.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
                If you are ready to match our execution velocity and dominate
                your niche space, let&apos;s talk.
              </p>
              <ApplyForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
