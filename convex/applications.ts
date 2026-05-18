import { mutation, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { requireUser, isSuperadmin } from "./authz";

/**
 * Expected, user-facing validation failure. Unlike a plain `throw new Error`,
 * a ConvexError is NOT logged as a server error and its `data` is always
 * delivered to the client verbatim (even in production), so the form can show
 * a precise message against the right field.
 */
function invalid(field: "name" | "email" | "concept", message: string): never {
  throw new ConvexError({ kind: "validation", field, message });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PUBLIC — submit a joint-venture application from the landing page.
 * No auth required. Stores the application and enqueues the notification
 * email via the Convex scheduler (our durable queue). `website` is a
 * honeypot: if a bot fills it, we pretend success and store nothing.
 */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    background: v.string(),
    concept: v.string(),
    website: v.optional(v.string()), // honeypot
  },
  handler: async (ctx, args) => {
    if (args.website && args.website.trim().length > 0) {
      return { ok: true as const };
    }

    const name = args.name.trim();
    const email = args.email.trim();
    const background = args.background.trim();
    const concept = args.concept.trim();

    if (name.length < 2) invalid("name", "Please enter your name.");
    if (!EMAIL_RE.test(email))
      invalid("email", "Please enter a valid email address.");
    if (concept.length < 20)
      invalid(
        "concept",
        "Tell us a bit more about your concept (at least 20 characters).",
      );

    const applicationId = await ctx.db.insert("applications", {
      name: name.slice(0, 200),
      email: email.slice(0, 320),
      background: background.slice(0, 2000),
      concept: concept.slice(0, 5000),
      status: "queued",
      attempts: 0,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendApplication, {
      applicationId,
    });

    return { ok: true as const };
  },
});

/** INTERNAL — used by the email action. */
export const getForEmail = internalQuery({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => ctx.db.get(applicationId),
});

/** INTERNAL — record the outcome of a send attempt. */
export const markStatus = internalMutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, status, error }) => {
    const app = await ctx.db.get(applicationId);
    if (!app) return;
    await ctx.db.patch(applicationId, {
      status,
      error,
      attempts: app.attempts + 1,
    });
  },
});

/** SUPERADMIN — view the application queue in /admin. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    if (!(await isSuperadmin(ctx, userId))) {
      throw new Error("Forbidden: superadmin only");
    }
    return await ctx.db.query("applications").order("desc").take(100);
  },
});
