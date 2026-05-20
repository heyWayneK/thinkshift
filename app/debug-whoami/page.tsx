// Server component. Dumps Clerk's server-side view of the request so we can
// see exactly what every protected page (/dashboard, /onboarding, /admin)
// would see at the moment auth() runs. The client child below adds the
// browser-side picture + the Convex auth handshake.
//
// Public route (not in proxy.ts protected matcher), works signed-in OR out.
// Safe to keep in prod — only exposes the caller's own identity + non-secret
// env. Delete this folder when done debugging.
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import DebugClient from "./DebugClient";

export const dynamic = "force-dynamic";

/** Pull the diagnostic claims out of a Clerk JWT without exposing the raw token. */
function decodeJwtClaims(token: string | null) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const c = JSON.parse(json) as Record<string, unknown>;
    return {
      iss: c.iss,
      aud: c.aud,
      azp: c.azp,
      sub: c.sub,
      exp: c.exp,
      iat: c.iat,
      expHuman: typeof c.exp === "number" ? new Date(c.exp * 1000).toISOString() : null,
      tokenLength: token.length,
    };
  } catch (err) {
    return { decodeError: err instanceof Error ? err.message : String(err) };
  }
}

export default async function DebugWhoAmIPage() {
  // Wrap auth() in try/catch so a thrown verification error surfaces here
  // instead of crashing the page (and tells us *why* the server can't read
  // the session that the browser clearly has).
  let a: Awaited<ReturnType<typeof auth>> | null = null;
  let authError: string | null = null;
  try {
    a = await auth();
  } catch (err) {
    authError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
  const h = await headers();
  const c = await cookies();

  // The Convex JWT template is what convex/auth.config.ts validates against.
  // If this is null while userId is set, Clerk has no template named "convex".
  let convexToken: string | null = null;
  let convexTokenError: string | null = null;
  try {
    convexToken = a ? await a.getToken({ template: "convex" }) : null;
  } catch (err) {
    convexTokenError = err instanceof Error ? err.message : String(err);
  }

  // Capture x-clerk-* headers that clerkMiddleware adds to the request before
  // the page handler runs. These reveal what middleware decided about auth.
  // x-clerk-auth-status: signed-in | signed-out
  // x-clerk-auth-reason: e.g. "session-token-and-uat-missing", "token-expired",
  //   "session-token-iat-in-the-future" — each reason points at a different bug.
  const clerkHeaders: Record<string, string> = {};
  h.forEach((v, k) => {
    if (k.toLowerCase().startsWith("x-clerk-")) clerkHeaders[k] = v;
  });

  // Names of cookies the server actually received in this request. If
  // __session / __session_<suffix> are NOT here while the browser shows them,
  // cookie scope (Domain attribute) is wrong. If they ARE here but auth()
  // still returns null, the issue is server-side JWT verification.
  const cookiesReceived = c.getAll().map((ck) => ck.name);
  const sessionCookiesPresent = {
    __session: c.has("__session"),
    __session_suffixed: cookiesReceived.some((n) =>
      /^__session_[A-Za-z0-9]+$/.test(n),
    ),
    __client_uat: c.has("__client_uat"),
    __client_uat_suffixed: cookiesReceived.some((n) =>
      /^__client_uat_[A-Za-z0-9]+$/.test(n),
    ),
  };

  const serverState = {
    authError,
    clerk: a
      ? {
          userId: a.userId,
          sessionId: a.sessionId,
          orgId: a.orgId,
          orgRole: a.orgRole,
          orgSlug: a.orgSlug,
          sessionClaims: a.sessionClaims
            ? {
                iss: a.sessionClaims.iss,
                azp: a.sessionClaims.azp,
                sub: a.sessionClaims.sub,
                exp: a.sessionClaims.exp,
                expHuman:
                  typeof a.sessionClaims.exp === "number"
                    ? new Date(a.sessionClaims.exp * 1000).toISOString()
                    : null,
              }
            : null,
        }
      : null,
    clerkMiddlewareHeaders: clerkHeaders,
    cookies: {
      received: cookiesReceived,
      sessionCookiesPresent,
    },
    convexJwt: {
      ok: !!convexToken,
      error: convexTokenError,
      claims: decodeJwtClaims(convexToken),
      hint:
        convexToken === null && !convexTokenError && a?.userId
          ? 'Server got NO Convex JWT. Most likely: Clerk has no JWT template named "convex" on the prod instance. Create one at: Clerk Dashboard -> Configure -> JWT templates -> + New template -> Convex.'
          : null,
    },
    request: {
      host: h.get("host"),
      xForwardedHost: h.get("x-forwarded-host"),
      xForwardedProto: h.get("x-forwarded-proto"),
      xVercelDeploymentUrl: h.get("x-vercel-deployment-url"),
    },
    env: {
      // Safe to display: NEXT_PUBLIC_* is build-inlined and ships to the browser
      // anyway; CLERK_JWT_ISSUER_DOMAIN is the public Clerk issuer URL.
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_prefix:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 8) ?? null,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? null,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? null,
      NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? null,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? null,
      CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN ?? null,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasSuperadminOrgId: !!process.env.SUPERADMIN_ORG_ID,
    },
  };

  return (
    <div className="bg-aura min-h-screen px-6 py-10 text-[#e8eaed]">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Debug: who am I?</h1>
          <p className="text-sm text-[#9aa0aa]">
            Server-side Clerk + Convex view of the current request. Works
            signed-in or out. The Convex panel below is rendered by the
            client (uses Convex realtime).
          </p>
        </header>

        <Card title="Clerk (server — what /dashboard, /onboarding, /admin see)">
          <Pre>{JSON.stringify(serverState.clerk, null, 2)}</Pre>
          {serverState.authError && (
            <p className="mt-2 text-xs text-red-300">
              auth() threw: <code>{serverState.authError}</code>
            </p>
          )}
        </Card>

        <Card title="clerkMiddleware decision (x-clerk-* request headers)">
          <Pre>
            {Object.keys(serverState.clerkMiddlewareHeaders).length === 0
              ? "(no x-clerk-* headers — middleware likely DID NOT RUN for this route — check proxy.ts matcher)"
              : JSON.stringify(serverState.clerkMiddlewareHeaders, null, 2)}
          </Pre>
        </Card>

        <Card title="Cookies the SERVER received (compare to client document.cookie below)">
          <Pre>{JSON.stringify(serverState.cookies, null, 2)}</Pre>
        </Card>

        <Card title="Convex JWT template handshake (server)">
          <Pre>{JSON.stringify(serverState.convexJwt, null, 2)}</Pre>
        </Card>

        <Card title="Request (host / forwarded headers)">
          <Pre>{JSON.stringify(serverState.request, null, 2)}</Pre>
        </Card>

        <Card title="Environment (server)">
          <Pre>{JSON.stringify(serverState.env, null, 2)}</Pre>
        </Card>

        <DebugClient />

        <p className="text-xs text-[#9aa0aa]">
          What to look for first:&nbsp;
          <strong>Clerk userId</strong> non-null but&nbsp;
          <strong>Convex JWT ok=false</strong> = missing &quot;convex&quot; JWT
          template on the Clerk prod instance. Or&nbsp;
          <strong>jwt iss</strong> ≠&nbsp;
          <strong>CLERK_JWT_ISSUER_DOMAIN</strong> = wrong issuer configured on
          Convex.
        </p>
      </div>
    </div>
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
