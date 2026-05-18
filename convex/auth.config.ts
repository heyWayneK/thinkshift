/**
 * Tells Convex to trust JWTs minted by Clerk.
 *
 * `domain` must equal the Clerk Frontend API URL (the JWT issuer), and
 * `applicationID` must match the name of the Clerk JWT template ("convex").
 *
 * This is the Clerk Frontend API URL for the `witty-octopus-65` instance.
 * When you move to a production Clerk instance, update this domain.
 */
const authConfig = {
  providers: [
    {
      domain: "https://witty-octopus-65.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
