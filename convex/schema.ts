import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Source of truth lives in Clerk. These tables are a read-model kept in
 * sync via the Clerk webhook (see convex/http.ts + convex/clerkSync.ts).
 */
export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("byClerkUserId", ["clerkUserId"]),

  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // True for the personal org auto-created for each user on signup.
    isPersonal: v.optional(v.boolean()),
  }).index("byClerkOrgId", ["clerkOrgId"]),

  memberships: defineTable({
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.string(),
  })
    .index("byClerkUserId", ["clerkUserId"])
    .index("byClerkOrgId", ["clerkOrgId"])
    .index("byUserAndOrg", ["clerkUserId", "clerkOrgId"]),

  /**
   * Example org-scoped application data (joint ventures). Demonstrates
   * role-gated mutations: admins manage ventures, members can add notes,
   * everyone in the org can read. Authorization is enforced against the
   * synced `memberships` table — see convex/authz.ts.
   */
  ventures: defineTable({
    clerkOrgId: v.string(),
    title: v.string(),
    status: v.union(
      v.literal("idea"),
      v.literal("building"),
      v.literal("live"),
      v.literal("archived"),
    ),
    createdByClerkUserId: v.string(),
    notes: v.array(
      v.object({
        authorClerkUserId: v.string(),
        authorName: v.optional(v.string()),
        text: v.string(),
        at: v.number(),
      }),
    ),
  }).index("byClerkOrgId", ["clerkOrgId"]),

  /**
   * Inbound joint-venture applications from the public landing page.
   * The Convex scheduler acts as the durable send queue (see convex/email.ts).
   * A questionnaire can be layered on later via extra optional fields.
   */
  applications: defineTable({
    name: v.string(),
    email: v.string(),
    mobile: v.optional(v.string()),
    // `background` (Your niche & community inroads) was retired 2026-05-26
    // in favour of `mobile`. Kept optional so historical rows still validate.
    background: v.optional(v.string()),
    concept: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
    attempts: v.number(),
  }).index("byStatus", ["status"]),
});
