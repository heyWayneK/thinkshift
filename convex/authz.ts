import { QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES } from "./access";

/**
 * Authorization helpers for org-scoped mutations/queries.
 *
 * Trust model:
 *  - `identity.subject` comes from the Clerk-issued JWT that Convex verifies
 *    (convex/auth.config.ts) — trustworthy.
 *  - The `memberships` table is written ONLY by the svix-verified Clerk
 *    webhook (convex/http.ts) — trustworthy.
 * So checking a (user, org, role) row against `memberships` is a sound
 * authorization decision even though the client passes the org id.
 */

type Ctx = QueryCtx | MutationCtx;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** The signed-in Clerk user id, or throw. */
export async function requireUser(ctx: Ctx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new AuthError("Not authenticated");
  return identity.subject;
}

async function roleIn(
  ctx: Ctx,
  clerkUserId: string,
  clerkOrgId: string,
): Promise<string | null> {
  const m = await ctx.db
    .query("memberships")
    .withIndex("byUserAndOrg", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("clerkOrgId", clerkOrgId),
    )
    .unique();
  return m?.role ?? null;
}

/** True if the user is an admin of the configured SUPERADMIN org. */
export async function isSuperadmin(
  ctx: Ctx,
  clerkUserId: string,
): Promise<boolean> {
  const superOrg = process.env.SUPERADMIN_ORG_ID;
  if (!superOrg) return false;
  return (await roleIn(ctx, clerkUserId, superOrg)) === ROLES.admin;
}

export type OrgContext = {
  clerkUserId: string;
  clerkOrgId: string;
  role: string | null;
  isSuperadmin: boolean;
};

/**
 * Require that the caller belongs to `clerkOrgId` (any role). Superadmins
 * pass for any org. Returns the resolved org context.
 */
export async function requireOrgMember(
  ctx: Ctx,
  clerkOrgId: string,
): Promise<OrgContext> {
  const clerkUserId = await requireUser(ctx);
  const role = await roleIn(ctx, clerkUserId, clerkOrgId);
  const superadmin = await isSuperadmin(ctx, clerkUserId);
  if (!role && !superadmin) {
    throw new AuthError("You are not a member of this organization");
  }
  return { clerkUserId, clerkOrgId, role, isSuperadmin: superadmin };
}

/**
 * Require that the caller is an `org:admin` of `clerkOrgId`. Superadmins
 * pass for any org.
 */
export async function requireOrgAdmin(
  ctx: Ctx,
  clerkOrgId: string,
): Promise<OrgContext> {
  const orgCtx = await requireOrgMember(ctx, clerkOrgId);
  if (orgCtx.role !== ROLES.admin && !orgCtx.isSuperadmin) {
    throw new AuthError("Requires organization admin");
  }
  return orgCtx;
}
