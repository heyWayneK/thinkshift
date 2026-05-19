import { QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";
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

/**
 * Throw an authorization failure as a ConvexError so the real message
 * survives to the client (plain Errors are redacted to "Server Error" in
 * production). `code` lets the UI distinguish e.g. unauthenticated vs
 * not-a-member.
 */
export function authDeny(
  code: "unauthenticated" | "not_member" | "forbidden",
  message: string,
): never {
  throw new ConvexError({ kind: "auth", code, message });
}

/** Back-compat: AuthError(message) now raises a ConvexError. */
export function AuthError(message: string): never {
  return authDeny("forbidden", message);
}

/** The signed-in Clerk user id, or throw. */
export async function requireUser(ctx: Ctx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) authDeny("unauthenticated", "Not signed in");
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
    authDeny(
      "not_member",
      "Your account isn't synced to an organization yet. If you just signed up, give it a moment; otherwise contact support.",
    );
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
    authDeny("forbidden", "Requires organization admin");
  }
  return orgCtx;
}
