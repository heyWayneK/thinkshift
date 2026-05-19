/**
 * Tells Convex to trust JWTs minted by Clerk.
 *
 * `domain` must equal the Clerk Frontend API URL (the JWT issuer), and
 * `applicationID` must match the name of the Clerk JWT template ("convex").
 *
 * Env-driven so dev and prod Clerk instances differ. Set
 * CLERK_JWT_ISSUER_DOMAIN on EACH Convex deployment:
 *   dev  -> https://witty-octopus-65.clerk.accounts.dev
 *   prod -> https://clerk.thinkshift-ai.com
 * Convex requires this var to exist on the deployment or the push fails.
 */
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
