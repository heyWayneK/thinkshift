import "server-only";
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const ROLES = {
  admin: "org:admin",
  member: "org:member",
} as const;

export type Viewer = {
  userId: string;
  /** Active organization (from the Clerk session). */
  orgId: string | null;
  orgRole: string | null;
  /** Admin of the *active* org. */
  isOrgAdmin: boolean;
  /** Admin of the designated SUPERADMIN org (app-wide superadmin). */
  isSuperadmin: boolean;
};

/**
 * Server-side access profile for the current request. Cached per request so
 * calling it from middleware-adjacent code, layouts and pages is cheap.
 * Returns null when unauthenticated.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return null;

  const superOrgId = process.env.SUPERADMIN_ORG_ID;
  let isSuperadmin = false;

  if (superOrgId) {
    if (orgId === superOrgId) {
      // Fast path: the superadmin org is the active org.
      isSuperadmin = orgRole === ROLES.admin;
    } else {
      // Otherwise look up the user's membership in the superadmin org.
      const client = await clerkClient();
      const { data } = await client.users.getOrganizationMembershipList({
        userId,
      });
      isSuperadmin = data.some(
        (m) =>
          m.organization.id === superOrgId && m.role === ROLES.admin,
      );
    }
  }

  return {
    userId,
    orgId: orgId ?? null,
    orgRole: orgRole ?? null,
    isOrgAdmin: orgRole === ROLES.admin,
    isSuperadmin,
  };
});

/** Throws (via redirect) unless the viewer is a superadmin. */
export async function requireSuperadmin() {
  const viewer = await getViewer();
  if (!viewer) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }
  if (!viewer.isSuperadmin) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return viewer;
}
