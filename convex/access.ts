import { query } from "./_generated/server";

/** Clerk's default organization roles. */
export const ROLES = {
  admin: "org:admin",
  member: "org:member",
} as const;

export type OrgRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * A user is a superadmin when they are an admin of the designated
 * SUPERADMIN organization (the ThinkShift org). Set SUPERADMIN_ORG_ID on the
 * Convex deployment to the Clerk org id (org_...). Until it's set, nobody is
 * a superadmin (safe default).
 */
function computeSuperadmin(
  memberships: { clerkOrgId: string; role: string }[],
): boolean {
  const superOrg = process.env.SUPERADMIN_ORG_ID;
  if (!superOrg) return false;
  return memberships.some(
    (m) => m.clerkOrgId === superOrg && m.role === ROLES.admin,
  );
}

/**
 * The signed-in user's access profile: their org memberships (with the Clerk
 * role mirrored from the webhook) and whether they are a superadmin.
 * Returns null when unauthenticated.
 */
export const myAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkUserId = identity.subject;

    const rawMemberships = await ctx.db
      .query("memberships")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    const memberships = await Promise.all(
      rawMemberships.map(async (m) => {
        const org = await ctx.db
          .query("organizations")
          .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", m.clerkOrgId))
          .unique();
        return {
          clerkOrgId: m.clerkOrgId,
          role: m.role,
          isAdmin: m.role === ROLES.admin,
          orgName: org?.name ?? null,
          isPersonal: org?.isPersonal ?? false,
        };
      }),
    );

    return {
      clerkUserId,
      memberships,
      isSuperadmin: computeSuperadmin(rawMemberships),
      superadminOrgId: process.env.SUPERADMIN_ORG_ID ?? null,
    };
  },
});
