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

## 5. Joint-venture applications + Microsoft Graph email

Public form at `/#apply` → `applications.submit` (no auth) stores the row
(`applications` table, `status: "queued"`) and enqueues the notification via
the **Convex scheduler** (the durable queue). `convex/email.ts` sends through
**Microsoft Graph `sendMail`** (app-only OAuth, no SMTP), marks the row
`sent`/`failed`, and retries with backoff up to 3 attempts. Superadmins see
the queue (and any errors) at `/admin`.

### Entra ID (Azure AD) app — one-time, needs an M365 admin

1. **App registrations → New registration** (single tenant). Note the
   **Directory (tenant) ID** and **Application (client) ID**.
2. **Certificates & secrets → New client secret** → copy the **value**.
3. **API permissions → Microsoft Graph → Application permissions →
   `Mail.Send`** → then **Grant admin consent**.
4. *(Recommended)* Limit the app to only the sender mailbox with an Exchange
   Online **Application Access Policy** (`New-ApplicationAccessPolicy`).

### Required on the Convex (production) deployment

```
MS_GRAPH_TENANT_ID     = <directory (tenant) id>
MS_GRAPH_CLIENT_ID     = <application (client) id>
MS_GRAPH_CLIENT_SECRET = <client secret value>
MS_GRAPH_SENDER        = wayne@thinkshift-ai.com
```

Until they're set, applications are still **safely stored and queued** — they
show `failed` ("env vars not set") in `/admin` and retry once the vars exist.
The old `MS356_EMAIL_SERVER_*` SMTP vars are no longer used (Graph avoids the
disabled-basic-auth problem entirely).

---

## 6. Convex production deployment (used by Vercel)

`vercel.json` build command is `npx convex deploy --cmd 'next build'`. On each
push it deploys Convex functions to the deployment that `CONVEX_DEPLOY_KEY`
targets and injects that deployment's `NEXT_PUBLIC_CONVEX_URL` into the Next
build automatically.

**One-time promotion from the dev deployment:**

1. Convex dashboard → **Project Settings → Production → Generate Production
   Deploy Key**. Add it to **Vercel → Settings → Environment Variables** as
   `CONVEX_DEPLOY_KEY` (Production scope).
2. Push (or redeploy). The first prod build creates the production Convex
   deployment with the schema + functions, and Vercel no longer needs a
   manual `NEXT_PUBLIC_CONVEX_URL` (Convex injects it).
3. In the Convex dashboard, switch to the **production** deployment and set
   its env vars: `CLERK_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`,
   `SUPERADMIN_ORG_ID`, and the four `MS_GRAPH_*` values.
4. Note the production deployment's site URL (`https://<name>.convex.site`)
   and **repoint the Clerk webhook endpoint** to
   `https://<name>.convex.site/clerk-webhook` (re-copy the signing secret if
   Clerk issues a new one).
5. `auth.config.ts` domain is unchanged (same Clerk instance). Keep the dev
   deployment for local `npx convex dev`.
