import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Diagnostic page: must render signed-in OR signed-out so we can compare
  // what auth() sees in both states. Safe (only exposes caller's own
  // identity). Remove with the rest of the debug code.
  "/debug-whoami(.*)",
]);

// The org-onboarding flow itself must stay reachable without an active org.
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, orgId, redirectToSignIn } = await auth();

  // Not signed in -> Clerk sign-in.
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Signed in but not part of any organization -> force org onboarding.
  // Everyone must belong to at least one Clerk organization.
  if (!orgId && !isOnboardingRoute(req)) {
    const url = new URL("/onboarding/organization", req.url);
    return NextResponse.redirect(url);
  }

  // Has an org but is still sitting on onboarding -> send to the app.
  if (orgId && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files,
    // and always run on API routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
