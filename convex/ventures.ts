import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrgAdmin, requireOrgMember, requireUser } from "./authz";

const statusValidator = v.union(
  v.literal("idea"),
  v.literal("building"),
  v.literal("live"),
  v.literal("archived"),
);

/** READ — any member of the org (superadmins included). */
export const list = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, { clerkOrgId }) => {
    await requireOrgMember(ctx, clerkOrgId);
    return await ctx.db
      .query("ventures")
      .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
      .order("desc")
      .collect();
  },
});

/** ADMIN — create a venture in the given org. */
export const create = mutation({
  args: { clerkOrgId: v.string(), title: v.string() },
  handler: async (ctx, { clerkOrgId, title }) => {
    const { clerkUserId } = await requireOrgAdmin(ctx, clerkOrgId);
    const clean = title.trim();
    if (clean.length < 2) throw new Error("Title is too short");

    return await ctx.db.insert("ventures", {
      clerkOrgId,
      title: clean.slice(0, 200),
      status: "idea",
      createdByClerkUserId: clerkUserId,
      notes: [],
    });
  },
});

/** ADMIN — change a venture's status. Org is derived from the doc. */
export const setStatus = mutation({
  args: {
    ventureId: v.id("ventures"),
    status: statusValidator,
  },
  handler: async (ctx, { ventureId, status }) => {
    const venture = await ctx.db.get(ventureId);
    if (!venture) throw new Error("Venture not found");
    await requireOrgAdmin(ctx, venture.clerkOrgId);
    await ctx.db.patch(ventureId, { status });
  },
});

/** ADMIN — delete a venture. Org is derived from the doc. */
export const remove = mutation({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    const venture = await ctx.db.get(ventureId);
    if (!venture) throw new Error("Venture not found");
    await requireOrgAdmin(ctx, venture.clerkOrgId);
    await ctx.db.delete(ventureId);
  },
});

/** MEMBER — any member of the venture's org can add a note. */
export const addNote = mutation({
  args: { ventureId: v.id("ventures"), text: v.string() },
  handler: async (ctx, { ventureId, text }) => {
    const venture = await ctx.db.get(ventureId);
    if (!venture) throw new Error("Venture not found");

    const { clerkUserId } = await requireOrgMember(ctx, venture.clerkOrgId);
    const clean = text.trim();
    if (!clean) throw new Error("Note is empty");

    const author = await ctx.db
      .query("users")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    await ctx.db.patch(ventureId, {
      notes: [
        ...venture.notes,
        {
          authorClerkUserId: clerkUserId,
          authorName: author?.name ?? undefined,
          text: clean.slice(0, 1000),
          at: Date.now(),
        },
      ],
    });
  },
});

/**
 * READ — the caller's role in the given org, so the UI can show/hide
 * admin-only controls. Mutations re-check server-side regardless.
 */
export const myOrgRole = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, { clerkOrgId }) => {
    const clerkUserId = await requireUser(ctx);
    const m = await ctx.db
      .query("memberships")
      .withIndex("byUserAndOrg", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("clerkOrgId", clerkOrgId),
      )
      .unique();
    return { role: m?.role ?? null };
  },
});
