import { query } from "./_generated/server";

/**
 * Returns the signed-in user's synced profile plus the organizations they
 * belong to. Reads identity from the Clerk-issued JWT that Convex verifies
 * (see convex/auth.config.ts). Returns null when unauthenticated.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkUserId = identity.subject;

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db
          .query("organizations")
          .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", m.clerkOrgId))
          .unique();
        return org ? { ...org, role: m.role } : null;
      }),
    );

    return {
      user,
      organizations: organizations.filter(Boolean),
    };
  },
});
