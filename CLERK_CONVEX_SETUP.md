# Clerk + Convex — Setup & Dashboard Steps

The code integration is done. Three things still need to be configured in the
**Clerk** and **Convex** dashboards. Do them in this order.

Reference values for this project:

| Thing | Value |
|---|---|
| Convex deployment | `amiable-rhinoceros-156` |
| Convex HTTP site URL | `https://amiable-rhinoceros-156.convex.site` |
| Clerk Frontend API (JWT issuer) | `https://witty-octopus-65.clerk.accounts.dev` |
| Webhook endpoint | `https://amiable-rhinoceros-156.convex.site/clerk-webhook` |

---

## 1. Clerk JWT template (required for Convex auth)

Convex verifies a Clerk-issued JWT named **`convex`**. Without this template,
`useQuery`/`useMutation` calls will be unauthenticated.

1. Clerk Dashboard → **JWT Templates** → **New template** → choose **Convex**.
2. Name it exactly **`convex`** (lowercase). Leave the default claims.
3. Save.

`convex/auth.config.ts` already trusts the issuer
`https://witty-octopus-65.clerk.accounts.dev` with applicationID `convex`.
When you move to a production Clerk instance, update the `domain` in that file
and re-run `npx convex deploy`.

---

## 2. Clerk webhook → Convex (user / org sync)

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL:**
   ```
   https://amiable-rhinoceros-156.convex.site/clerk-webhook
   ```
3. **Subscribe to these 9 events** (and only these):
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
4. Create the endpoint, then open it and copy the **Signing Secret**
   (starts with `whsec_`).

### Put the signing secret in TWO places

- **`.env.local`** → `CLERK_WEBHOOK_SECRET=whsec_...` (already present — make
  sure it matches the value Clerk shows).
- **Convex dashboard** (this is the one that actually verifies the webhook —
  it could not be set via CLI with the provided deploy key):

  https://dashboard.convex.dev/d/amiable-rhinoceros-156/settings/environment-variables

  Add a variable:
  ```
  CLERK_WEBHOOK_SECRET = whsec_...   (same value)
  ```

> The Convex HTTP action (`convex/http.ts`) reads `CLERK_WEBHOOK_SECRET` from
> the **Convex** environment, not from `.env.local`. If it isn't set on Convex,
> every webhook returns `400 Invalid signature`.

> ⚠️ **Current `.env.local` is wrong.** `CLERK_WEBHOOK_SECRET` is set to the
> endpoint URL (`https://...convex.site/clerk-webhook`). It must be the
> **signing secret** that starts with `whsec_`, copied from the Clerk webhook
> endpoint page. Fix it in `.env.local` **and** set the same value in Convex.

Test it with the **Send example** button in the Clerk webhook UI, then check
**Logs** in the Convex dashboard for a `200`.

### Also required on the Convex deployment

The signup auto-org flow calls the Clerk Backend API from Convex, and the
superadmin check reads the designated org id. Add these in the **same Convex
env vars page**:

```
CLERK_SECRET_KEY  = sk_test_...      (same value as .env.local)
SUPERADMIN_ORG_ID = org_...          (your ThinkShift org id; see §4)
```

| Variable | .env.local (Next) | Convex dashboard | Purpose |
|---|:--:|:--:|---|
| `CLERK_WEBHOOK_SECRET` | ✅ | ✅ | Verify incoming webhooks |
| `CLERK_SECRET_KEY` | ✅ | ✅ | Convex → Clerk Backend API (create org) |
| `SUPERADMIN_ORG_ID` | ✅ | ✅ | Which org's admins are superadmins |

---

## 3. Organizations — everyone must belong to at least one

**In Clerk Dashboard → Organizations:**

1. **Enable Organizations**.
2. Under **Settings**, turn **off** "Allow users to delete their last
   organization" if you want the constraint to hold permanently, and configure
   whether members can create orgs.

**Auto-org on signup (already implemented):** when Clerk fires `user.created`,
`convex/http.ts` calls the Clerk Backend API to create a personal org
(`"<Name> Workspace"`, the new user becomes its **org:admin**), tagged with
`public_metadata.personal = true`. It's idempotent — skipped if the user
already has any membership (handles retries and invited users).

**App-side enforcement (fallback):** `middleware.ts` still redirects any
signed-in user **without an active org** to `/onboarding/organization`. With
auto-org this should rarely trigger, but it guarantees the no-org state can't
reach the app. Personal accounts are hidden everywhere (`hidePersonal`).

---

## 4. Roles & superadmin

**Role model:** Clerk's built-in org roles (`org:admin`, `org:member`) are the
source of truth. The membership webhook mirrors `role` into the Convex
`memberships` table, so both the client (`convex/access.ts → myAccess`) and
the server (`app/lib/access.ts → getViewer`) can read it.

**Superadmin = admin of the designated SUPERADMIN org:**

1. In Clerk, create your **ThinkShift** organization (this is the superadmin
   org). Copy its id (`org_...`).
2. Put it in `SUPERADMIN_ORG_ID` — in `.env.local` **and** the Convex env
   vars page.
3. Anyone who is `org:admin` of that org now:
   - sees a **Superadmin → Control room** link on `/dashboard`,
   - can reach `/admin` (guarded server-side by `requireSuperadmin()`),
   - gets `isSuperadmin: true` from `getViewer()` / `myAccess`.

Until `SUPERADMIN_ORG_ID` is set, `isSuperadmin` is `false` for everyone
(safe default) and `/admin` redirects to `/dashboard`.

> To make yourself superadmin: create the ThinkShift org while signed in as
> yourself (you become its admin), then set `SUPERADMIN_ORG_ID` to its id.

---

## How the pieces fit

```
Browser ──(Clerk JWT "convex" template)──> Convex  (auth.config.ts trusts issuer)
Clerk ──(webhook, svix-signed)──> convex/http.ts /clerk-webhook
        └─> internal mutations in convex/clerkSync.ts
            └─> users / organizations / memberships tables (read model)
```

- Source of truth = Clerk. Convex tables are a synced read-model.
- `convex/users.ts:me` returns the signed-in user + their orgs (used by the
  dashboard's "Synced from Clerk → Convex" panel) to confirm the loop works.

## Local dev

```bash
npx convex dev      # keeps Convex functions in sync (terminal 1)
npm run dev         # Next.js (terminal 2)
```

Sign up at `/sign-up` → you'll be forced through `/onboarding/organization`
→ then land on `/dashboard`.

---

## 5. Joint-venture applications + MS365 email

Public form at `/#apply` → `applications.submit` (no auth) stores the row
(`applications` table, `status: "queued"`) and enqueues the notification via
the **Convex scheduler** (the durable queue). `convex/email.ts` is a Node
action that sends through MS365 SMTP with nodemailer, marks the row
`sent`/`failed`, and retries with backoff up to 3 attempts. Superadmins see
the queue (and any SMTP errors) at `/admin`.

### Required on the Convex deployment

The email action runs **inside Convex**, so these must be set in the Convex
dashboard env vars (the values exist in `.env.local`, but Next can't pass them
to Convex):

```
MS356_EMAIL_SERVER_HOST     = smtp.office365.com
MS356_EMAIL_SERVER_PORT     = 587
MS356_EMAIL_SERVER_USER     = wayne@thinkshift-ai.com
MS356_EMAIL_SERVER_PASSWORD = <mailbox password / app password>
```

Until they're set, applications are still **safely stored and queued** — they
just show `failed` ("env vars not set") in `/admin` and will send once the
vars are added (resubmit, or they retry on the next scheduled attempt).

> ⚠️ **Office 365 caveat:** Microsoft disables SMTP AUTH (basic auth) on
> mailboxes by default — your own comment called it "legacy." If sends fail
> with an auth error, either enable **Authenticated SMTP** for
> `wayne@thinkshift-ai.com` (Microsoft 365 admin → Active users → Mail) and
> use an **app password** if MFA is on, or switch the action to the Microsoft
> Graph API (`Mail.Send`, OAuth client-credentials) — say the word and I'll
> swap it. Either way the application data is never lost; only delivery is
> affected, and the error is visible in `/admin`.
