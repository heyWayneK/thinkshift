import { query } from "./_generated/server";

/**
 * Diagnostic: returns what Convex sees as the caller's identity, plus the
 * server-side env used to validate the Clerk JWT.
 *
 * If `identity` is null while you ARE signed in on Clerk, the Clerk→Convex
 * JWT handshake failed. Common causes (in order of likelihood):
 *   1. No JWT template named "convex" exists on the Clerk instance
 *      (auth.config.ts has `applicationID: "convex"`).
 *   2. `CLERK_JWT_ISSUER_DOMAIN` on this Convex deployment doesn't match
 *      the Clerk instance issuer (must be the prod issuer for prod).
 *   3. Token expired / clock skew.
 *
 * Returns gracefully even when unauthenticated — never throws.
 */
export const whoAmI = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      identity,
      env: {
        clerkJwtIssuerDomain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? null,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasSuperadminOrgId: !!process.env.SUPERADMIN_ORG_ID,
      },
      ts: Date.now(),
    };
  },
});
