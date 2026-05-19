import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getViewer } from "@/app/lib/access";
import SyncStatus from "./SyncStatus";
import Ventures from "./Ventures";

export default async function DashboardPage() {
  const viewer = await getViewer();

  // Defense in depth — middleware already enforces these.
  if (!viewer) redirect("/sign-in");
  if (!viewer.orgId) redirect("/onboarding/organization");

  const roleLabel = viewer.isOrgAdmin ? "Admin" : "Member";

  return (
    <div className="bg-aura relative min-h-screen">
      <div className="bg-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image
              src="/thinkshift_logo_white.svg"
              alt="ThinkShift"
              width={1071}
              height={203}
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              afterLeaveOrganizationUrl="/onboarding/organization"
            />
            <UserButton showName />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Partner <span className="text-gradient">dashboard</span>
          </h1>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted">
            {roleLabel} of active org
          </span>
          {viewer.isSuperadmin && (
            <Link
              href="/admin"
              className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Superadmin → Control room
            </Link>
          )}
        </div>
        <p className="mt-3 max-w-xl text-muted">
          You&apos;re signed in and operating inside an organization. Clerk is
          authenticating Convex, and the webhook keeps users, organizations, and
          memberships (with roles) in sync.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <SyncStatus />
          <div className="card p-6 text-sm text-muted">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Active context
            </p>
            <p className="mt-4">
              <span className="text-muted">Clerk user:</span> {viewer.userId}
            </p>
            <p className="mt-1">
              <span className="text-muted">Active org:</span> {viewer.orgId}
            </p>
            <p className="mt-1">
              <span className="text-muted">Role:</span> {viewer.orgRole ?? "—"}
            </p>
            <p className="mt-1">
              <span className="text-muted">Superadmin:</span>{" "}
              {viewer.isSuperadmin ? "yes" : "no"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Ventures />
        </div>
      </main>
    </div>
  );
}
