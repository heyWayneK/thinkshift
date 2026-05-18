import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { requireSuperadmin } from "@/app/lib/access";
import AdminDirectory from "./AdminDirectory";
import AdminApplications from "./AdminApplications";

export default async function AdminPage() {
  await requireSuperadmin();

  return (
    <div className="bg-aura relative min-h-screen">
      <div className="bg-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard">
            <Image
              src="/thinkshift_logo_white.svg"
              alt="ThinkShift"
              width={1071}
              height={203}
              className="h-7 w-auto"
            />
          </Link>
          <UserButton />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          Superadmin
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Control <span className="text-gradient">room</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Manage every partner organization synced from Clerk — promote or
          demote admins and remove members. Changes go through Clerk and sync
          back automatically.
        </p>

        <div className="mt-10 space-y-10">
          <AdminApplications />
          <AdminDirectory />
        </div>
      </main>
    </div>
  );
}
