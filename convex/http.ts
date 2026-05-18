import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

type ClerkEmail = { id?: string; email_address?: string };

type ClerkData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string;
  name?: string;
  slug?: string;
  public_metadata?: Record<string, unknown> | null;
  organization?: { id: string };
  public_user_data?: { user_id: string };
  role?: string;
};

type ClerkEvent = {
  type: string;
  data: ClerkData;
};

async function verify(req: Request): Promise<ClerkEvent | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set on the Convex deployment");
    return null;
  }
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };
  try {
    return new Webhook(secret).verify(payload, headers) as ClerkEvent;
  } catch (err) {
    console.error("Clerk webhook signature verification failed", err);
    return null;
  }
}

function primaryEmail(data: ClerkData): string | undefined {
  const list = data.email_addresses;
  if (!list?.length) return undefined;
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary ?? list[0])?.email_address;
}

function fullName(data: ClerkData): string | undefined {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return name || data.username || undefined;
}

const CLERK_API = "https://api.clerk.com/v1";

function clerkApi(path: string, init?: RequestInit) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("CLERK_SECRET_KEY is not set on Convex");
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Idempotently create a personal organization for a brand-new user and make
 * them its admin (`created_by` => org:admin in Clerk). Skips if the user
 * already belongs to any org (handles webhook retries and invited users).
 * The org.created / membership.created webhooks Clerk fires back are what
 * actually sync the rows into Convex.
 */
async function ensurePersonalOrg(
  clerkUserId: string,
  displayName: string | undefined,
) {
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn("Skipping personal-org creation: CLERK_SECRET_KEY not set");
    return;
  }
  const existing = await clerkApi(
    `/users/${clerkUserId}/organization_memberships?limit=1`,
  );
  if (!existing.ok) {
    console.error("Clerk membership lookup failed", await existing.text());
    return;
  }
  const { total_count } = (await existing.json()) as { total_count: number };
  if (total_count > 0) return;

  const name = `${displayName?.trim() || "My"} Workspace`.slice(0, 256);
  const res = await clerkApi("/organizations", {
    method: "POST",
    body: JSON.stringify({
      name,
      created_by: clerkUserId,
      public_metadata: { personal: true, created_for: clerkUserId },
    }),
  });
  if (!res.ok) {
    console.error("Clerk org creation failed", await res.text());
  }
}

const handleClerkWebhook = httpAction(async (ctx, req) => {
  const event = await verify(req);
  if (!event) return new Response("Invalid signature", { status: 400 });

  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const name = fullName(data);
      await ctx.runMutation(internal.clerkSync.upsertUser, {
        clerkUserId: data.id,
        email: primaryEmail(data),
        name,
        imageUrl: data.image_url,
      });
      if (type === "user.created") {
        await ensurePersonalOrg(data.id, name);
      }
      break;
    }

    case "user.deleted":
      if (data.id) {
        await ctx.runMutation(internal.clerkSync.deleteUser, {
          clerkUserId: data.id,
        });
      }
      break;

    case "organization.created":
    case "organization.updated":
      await ctx.runMutation(internal.clerkSync.upsertOrg, {
        clerkOrgId: data.id,
        name: data.name ?? "Organization",
        slug: data.slug,
        imageUrl: data.image_url,
        isPersonal: data.public_metadata?.personal === true,
      });
      break;

    case "organization.deleted":
      if (data.id) {
        await ctx.runMutation(internal.clerkSync.deleteOrg, {
          clerkOrgId: data.id,
        });
      }
      break;

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const userId = data.public_user_data?.user_id;
      const orgId = data.organization?.id;
      if (userId && orgId) {
        await ctx.runMutation(internal.clerkSync.upsertMembership, {
          clerkUserId: userId,
          clerkOrgId: orgId,
          role: data.role ?? "org:member",
        });
      }
      break;
    }

    case "organizationMembership.deleted": {
      const userId = data.public_user_data?.user_id;
      const orgId = data.organization?.id;
      if (userId && orgId) {
        await ctx.runMutation(internal.clerkSync.deleteMembership, {
          clerkUserId: userId,
          clerkOrgId: orgId,
        });
      }
      break;
    }

    default:
      // Unhandled event types are acknowledged so Clerk doesn't retry.
      break;
  }

  return new Response(null, { status: 200 });
});

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
