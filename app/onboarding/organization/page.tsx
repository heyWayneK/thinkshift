import { OrganizationList } from "@clerk/nextjs";

export default function OrganizationOnboardingPage() {
  return (
    <div className="bg-aura flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One more step
        </h1>
        <p className="mt-2 max-w-md text-muted">
          Every ThinkShift partner works inside an organization. Create your
          venture or join one you&apos;ve been invited to.
        </p>
      </div>
      <OrganizationList
        hidePersonal
        skipInvitationScreen
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />
    </div>
  );
}
