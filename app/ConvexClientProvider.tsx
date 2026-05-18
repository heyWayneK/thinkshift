"use client";

import { ReactNode, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Construct lazily (not at module load) and guard a missing URL so static
  // pages like /_not-found can still prerender when the env var isn't present
  // at build time. Convex hooks live only on dynamic, env-configured routes.
  const [client] = useState(() =>
    convexUrl ? new ConvexReactClient(convexUrl) : null,
  );

  if (!client) {
    if (typeof window !== "undefined") {
      console.error(
        "NEXT_PUBLIC_CONVEX_URL is not set — Convex features are disabled. " +
          "Set it in your hosting provider's environment variables.",
      );
    }
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
