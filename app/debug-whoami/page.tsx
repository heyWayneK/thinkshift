"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Temporary debug page — shows exactly what the Convex server sees for the
 * currently signed-in user. Used to diagnose superadmin detection issues.
 *
 * Visit while signed in: http://localhost:3000/debug-whoami
 *
 * Outside any auth-gated layout so you can actually reach it. Safe to keep
 * in production (only reveals the caller's own identity) but feel free to
 * delete the whole /app/debug-whoami folder once you're done debugging.
 */
export default function DebugWhoAmIPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const data = useQuery(api.blog_category.fe_blog_debugWhoAmI, {});

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Debug: whoami</h1>
        <p className="text-sm text-base-content/70">
          Shows what the Convex server sees for the currently signed-in user.
        </p>

        <div className="card bg-base-100 border border-base-300 p-4">
          <h2 className="font-semibold mb-2">Clerk (frontend)</h2>
          <pre className="text-xs bg-base-200 p-3 rounded overflow-x-auto">
            {JSON.stringify({ isLoaded, isSignedIn }, null, 2)}
          </pre>
        </div>

        <div className="card bg-base-100 border border-base-300 p-4">
          <h2 className="font-semibold mb-2">Convex (server)</h2>
          {data === undefined ? (
            <p className="text-sm text-base-content/60">Loading...</p>
          ) : (
            <pre className="text-xs bg-base-200 p-3 rounded overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>

        <p className="text-xs text-base-content/50">
          Look at <code>memberships[]</code> — each entry shows{" "}
          <code>convexOrgId</code> and <code>qualifiesAsSuperAdmin</code>. If
          none qualify, your active org's <code>convexOrgId</code> doesn't match
          the server's <code>superAdminOrgIdConfigured</code>.
        </p>
      </div>
    </div>
  );
}
