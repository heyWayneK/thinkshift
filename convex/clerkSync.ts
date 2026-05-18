import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Upsert a user from a Clerk `user.created` / `user.updated` event. */
export const upsertUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
    } else {
      await ctx.db.insert("users", args);
    }
  },
});

/** Remove a user (and their memberships) on `user.deleted`. */
export const deleteUser = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (user) await ctx.db.delete(user._id);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    for (const m of memberships) await ctx.db.delete(m._id);
  },
});

/** Upsert an organization from `organization.created` / `organization.updated`. */
export const upsertOrg = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isPersonal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
        imageUrl: args.imageUrl,
        // Only ever set isPersonal true; never downgrade an existing flag.
        isPersonal: args.isPersonal || existing.isPersonal,
      });
    } else {
      await ctx.db.insert("organizations", args);
    }
  },
});

/** Remove an organization (and its memberships) on `organization.deleted`. */
export const deleteOrg = internalMutation({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, { clerkOrgId }) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
      .unique();
    if (org) await ctx.db.delete(org._id);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
      .collect();
    for (const m of memberships) await ctx.db.delete(m._id);
  },
});

/** Upsert a membership from `organizationMembership.created` / `.updated`. */
export const upsertMembership = internalMutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("clerkUserId", args.clerkUserId).eq("clerkOrgId", args.clerkOrgId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert("memberships", args);
    }
  },
});

/** Remove a membership on `organizationMembership.deleted`. */
export const deleteMembership = internalMutation({
  args: { clerkUserId: v.string(), clerkOrgId: v.string() },
  handler: async (ctx, { clerkUserId, clerkOrgId }) => {
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("clerkOrgId", clerkOrgId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
