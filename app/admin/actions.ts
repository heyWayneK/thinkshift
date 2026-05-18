"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getViewer, ROLES } from "@/app/lib/access";

type Result = { ok: true } | { ok: false; error: string };

async function guard() {
  const viewer = await getViewer();
  if (!viewer?.isSuperadmin) throw new Error("Forbidden: superadmin only");
  return viewer;
}

const SUPER_ORG = process.env.SUPERADMIN_ORG_ID;

/** Promote/demote a member between org:admin and org:member. */
export async function setMemberRole(
  orgId: string,
  userId: string,
  role: string,
): Promise<Result> {
  const viewer = await guard();

  if (role !== ROLES.admin && role !== ROLES.member) {
    return { ok: false, error: "Invalid role" };
  }
  // Don't let a superadmin demote themselves out of the superadmin org.
  if (
    orgId === SUPER_ORG &&
    userId === viewer.userId &&
    role !== ROLES.admin
  ) {
    return {
      ok: false,
      error: "You can't remove your own superadmin access.",
    };
  }

  try {
    const client = await clerkClient();
    await client.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId,
      role,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Remove a member from an organization entirely. */
export async function removeMember(
  orgId: string,
  userId: string,
): Promise<Result> {
  const viewer = await guard();

  if (orgId === SUPER_ORG && userId === viewer.userId) {
    return {
      ok: false,
      error: "You can't remove yourself from the superadmin org.",
    };
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
