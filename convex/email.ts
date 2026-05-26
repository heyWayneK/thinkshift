import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MAX_ATTEMPTS = 3;

/**
 * Acquire an app-only Microsoft Graph token via client credentials.
 * Requires Entra ID app registration with Application permission `Mail.Send`
 * (admin-consented). No SMTP / basic auth involved.
 */
async function graphToken(): Promise<string> {
  const tenant = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error("MS_GRAPH_* env vars are not set on the Convex deployment");
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Token request failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("No access_token in token response");
  return json.access_token;
}

/**
 * INTERNAL — sends the joint-venture application notification via Microsoft
 * Graph `sendMail`. Enqueued by applications.submit through the Convex
 * scheduler. Records the outcome and retries with backoff up to 3 attempts.
 */
export const sendApplication = internalAction({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const app = await ctx.runQuery(internal.applications.getForEmail, {
      applicationId,
    });
    if (!app || app.status === "sent") return;

    const sender = process.env.MS_GRAPH_SENDER;
    if (!sender) {
      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "failed",
        error: "MS_GRAPH_SENDER is not set on the Convex deployment",
      });
      return;
    }

    try {
      const token = await graphToken();

      const res = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          sender,
        )}/sendMail`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              subject: `JV application — ${app.name}`,
              body: {
                contentType: "Text",
                content: [
                  `New joint-venture application.`,
                  ``,
                  `Name:   ${app.name}`,
                  `Email:  ${app.email}`,
                  `Mobile: ${app.mobile || "(not provided)"}`,
                  ``,
                  `Concept:`,
                  app.concept,
                ].join("\n"),
              },
              toRecipients: [{ emailAddress: { address: sender } }],
              replyTo: [
                { emailAddress: { address: app.email, name: app.name } },
              ],
            },
            saveToSentItems: false,
          }),
        },
      );

      // Graph sendMail returns 202 Accepted on success.
      if (res.status !== 202) {
        throw new Error(`sendMail failed (${res.status}): ${await res.text()}`);
      }

      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "sent",
      });
    } catch (e) {
      const message = (e as Error).message ?? "Unknown Graph error";
      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "failed",
        error: message,
      });

      const nextAttempt = app.attempts + 1;
      if (nextAttempt < MAX_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          nextAttempt * 60_000,
          internal.email.sendApplication,
          { applicationId },
        );
      }
    }
  },
});
