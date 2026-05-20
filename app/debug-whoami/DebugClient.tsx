"use client";

// Browser-side companion to page.tsx. Compare these values to the server-side
// dump — divergence is the bug (e.g. client signed-in but server userId=null
// means the session cookie isn't reaching the server / middleware).
import { useEffect, useState } from "react";
import {
  useAuth,
  useClerk,
  useOrganization,
  useUser,
} from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type ConvexClaims = {
  iss?: unknown;
  aud?: unknown;
  azp?: unknown;
  sub?: unknown;
  exp?: unknown;
  expHuman?: string | null;
  tokenLength?: number;
  decodeError?: string;
};

function decodeJwtClaims(token: string | null): ConvexClaims | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    // atob handles standard base64; replace base64url chars first.
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "="));
    const c = JSON.parse(json) as Record<string, unknown>;
    return {
      iss: c.iss,
      aud: c.aud,
      azp: c.azp,
      sub: c.sub,
      exp: c.exp,
      expHuman:
        typeof c.exp === "number" ? new Date(c.exp * 1000).toISOString() : null,
      tokenLength: token.length,
    };
  } catch (err) {
    return { decodeError: err instanceof Error ? err.message : String(err) };
  }
}

export default function DebugClient() {
  const auth = useAuth();
  const user = useUser();
  const org = useOrganization();
  const clerk = useClerk();
  const convexAuth = useConvexAuth();

  // Convex query never throws here — it just returns undefined while loading.
  // If our auth handshake works, identity will be non-null after sign-in.
  const convexWhoAmI = useQuery(api.debug.whoAmI, {});

  const [convexJwt, setConvexJwt] = useState<{
    ok: boolean;
    claims: ConvexClaims | null;
    error: string | null;
  } | null>(null);

  // Mirror the server-side getToken({template:"convex"}) probe in the browser.
  // Re-run on auth state changes so we capture the post-OTP transition.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.getToken({ template: "convex" });
        if (cancelled) return;
        setConvexJwt({
          ok: !!token,
          claims: decodeJwtClaims(token),
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setConvexJwt({
          ok: false,
          claims: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, auth.isSignedIn, auth.userId, auth.sessionId]);

  const clientState = {
    useAuth: {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn,
      userId: auth.userId,
      sessionId: auth.sessionId,
      orgId: auth.orgId,
      orgRole: auth.orgRole,
      orgSlug: auth.orgSlug,
    },
    useUser: {
      isLoaded: user.isLoaded,
      isSignedIn: user.isSignedIn,
      id: user.user?.id ?? null,
      primaryEmail: user.user?.primaryEmailAddress?.emailAddress ?? null,
      createdAt: user.user?.createdAt?.toISOString() ?? null,
    },
    useOrganization: {
      isLoaded: org.isLoaded,
      orgId: org.organization?.id ?? null,
      orgSlug: org.organization?.slug ?? null,
      orgName: org.organization?.name ?? null,
      membership_role: org.membership?.role ?? null,
    },
    useConvexAuth: {
      isLoading: convexAuth.isLoading,
      isAuthenticated: convexAuth.isAuthenticated,
    },
    window:
      typeof window !== "undefined"
        ? {
            host: window.location.host,
            href: window.location.href,
            cookieNames: document.cookie
              .split(";")
              .map((c) => c.trim().split("=")[0])
              .filter(Boolean),
          }
        : null,
  };

  return (
    <>
      <Card title="Clerk (client — useAuth / useUser / useOrganization)">
        <Pre>{JSON.stringify(clientState, null, 2)}</Pre>
      </Card>

      <Card title="Convex JWT template handshake (client probe of getToken)">
        <Pre>
          {convexJwt
            ? JSON.stringify(convexJwt, null, 2)
            : "(probing...)"}
        </Pre>
      </Card>

      <Card title="Convex query api.debug.whoAmI (live subscription)">
        <Pre>
          {convexWhoAmI === undefined
            ? "(loading — if this stays Loading forever, the Convex client isn't authenticating: check NEXT_PUBLIC_CONVEX_URL and that the convex client is wrapped in ConvexProviderWithClerk in providers)"
            : JSON.stringify(convexWhoAmI, null, 2)}
        </Pre>
      </Card>

      <Card title="Actions">
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/dashboard"
            className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5"
          >
            Go to /dashboard
          </a>
          <a
            href="/onboarding/organization"
            className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5"
          >
            Go to /onboarding/organization
          </a>
          <a
            href="/sign-in"
            className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5"
          >
            Go to /sign-in
          </a>
          <button
            type="button"
            onClick={() => clerk.signOut({ redirectUrl: "/" })}
            className="rounded-md bg-[#34d399] px-3 py-1.5 font-semibold text-[#04110d] hover:brightness-110"
          >
            Sign out
          </button>
        </div>
      </Card>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0d0f12]/80 p-4 shadow-2xl">
      <h2 className="mb-2 text-sm font-semibold text-[#e8eaed]">{title}</h2>
      {children}
    </section>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-[#15181d] p-3 text-xs leading-relaxed text-[#e8eaed]">
      {children}
    </pre>
  );
}
