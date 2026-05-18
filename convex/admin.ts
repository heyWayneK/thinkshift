import { query } from "./_generated/server";
import { QueryCtx } from "./_generated/server";
import { ROLES } from "./access";

/** Throws unless the caller is an admin of the SUPERADMIN org. */
async function assertSuperadmin(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const superOrg = process.env.SUPERADMIN_ORG_ID;
  if (!superOrg) throw new Error("SUPERADMIN_ORG_ID is not configured");

  const membership = await ctx.db
    .query("memberships")
    .withIndex("byUserAndOrg", (q) =>
      q.eq("clerkUserId", identity.subject).eq("clerkOrgId", superOrg),
    )
    .unique();

  if (!membership || membership.role !== ROLES.admin) {
    throw new Error("Forbidden: superadmin only");
  }
  return identity.subject;
}

/**
 * Partner directory for the superadmin /admin view: every synced org with its
 * members (name, email, role), plus orphan users (no membership yet).
 */
export const directory = query({
  args: {},
  handler: async (ctx) => {
    await assertSuperadmin(ctx);

    const [orgs, users, memberships] = await Promise.all([
      ctx.db.query("organizations").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("memberships").collect(),
    ]);

    const userByClerk = new Map(users.map((u) => [u.clerkUserId, u]));
    const membersByOrg = new Map<string, typeof memberships>();
    for (const m of memberships) {
      const list = membersByOrg.get(m.clerkOrgId) ?? [];
      list.push(m);
      membersByOrg.set(m.clerkOrgId, list);
    }

    const organizations = orgs
      .map((o) => ({
        clerkOrgId: o.clerkOrgId,
        name: o.name,
        isPersonal: o.isPersonal ?? false,
        members: (membersByOrg.get(o.clerkOrgId) ?? []).map((m) => ({
          clerkUserId: m.clerkUserId,
          role: m.role,
          name: userByClerk.get(m.clerkUserId)?.name ?? null,
          email: userByClerk.get(m.clerkUserId)?.email ?? null,
        })),
      }))
      .sort((a, b) => Number(a.isPersonal) - Number(b.isPersonal));

    const membersSet = new Set(memberships.map((m) => m.clerkUserId));
    const orphanUsers = users
      .filter((u) => !membersSet.has(u.clerkUserId))
      .map((u) => ({
        clerkUserId: u.clerkUserId,
        name: u.name ?? null,
        email: u.email ?? null,
      }));

    return {
      organizations,
      orphanUsers,
      totalUsers: users.length,
      superadminOrgId: process.env.SUPERADMIN_ORG_ID ?? null,
    };
  },
});
