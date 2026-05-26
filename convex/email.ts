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
 * Single Graph `sendMail` call. Sends as `sender` (the mailbox we own) to one
 * recipient with a configurable reply-to. Graph returns 202 Accepted on
 * success; anything else is treated as a failure.
 */
async function sendOneMail(args: {
  sender: string;
  token: string;
  to: string;
  toName?: string;
  subject: string;
  content: string;
  replyTo: { address: string; name?: string };
}): Promise<void> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(args.sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: args.subject,
          body: { contentType: "Text", content: args.content },
          toRecipients: [
            {
              emailAddress: args.toName
                ? { address: args.to, name: args.toName }
                : { address: args.to },
            },
          ],
          replyTo: [{ emailAddress: args.replyTo }],
        },
        saveToSentItems: false,
      }),
    },
  );

  if (res.status !== 202) {
    throw new Error(
      `sendMail to ${args.to} failed (${res.status}): ${await res.text()}`,
    );
  }
}

/**
 * INTERNAL — sends two emails for every joint-venture application:
 *   1. Internal notification to Wayne (the SENDER mailbox) with the
 *      submission details and the applicant's address as the reply-to.
 *   2. Thank-you confirmation to the applicant echoing back what they
 *      submitted, with Wayne's address as the reply-to.
 *
 * Enqueued by applications.submit through the Convex scheduler. Records the
 * outcome and retries with backoff up to 3 attempts. If the second send
 * fails after the first succeeded, a retry will re-send the first too —
 * Wayne may see a duplicate. Acceptable trade-off for a low-volume form.
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

    // Shared submission block — appears in both emails so each recipient has
    // the same record of what was sent.
    const detailLines = [
      `Name:   ${app.name}`,
      `Email:  ${app.email}`,
      `Mobile: ${app.mobile || "(not provided)"}`,
      ``,
      `Concept:`,
      app.concept,
    ];

    try {
      const token = await graphToken();

      // 1) Internal notification to Wayne.
      await sendOneMail({
        sender,
        token,
        to: sender,
        subject: `JV application — ${app.name}`,
        content: [
          `New joint-venture application.`,
          ``,
          ...detailLines,
        ].join("\n"),
        // Hitting "reply" in Wayne's mail client sends straight to the applicant.
        replyTo: { address: app.email, name: app.name },
      });

      // 2) Thank-you confirmation back to the applicant.
      await sendOneMail({
        sender,
        token,
        to: app.email,
        toName: app.name,
        subject: `Thank you — we received your ThinkShift application`,
        content: [
          `Hi ${app.name},`,
          ``,
          `Thank you for sending this message below.`,
          ``,
          `We've received your joint-venture application. We read every`,
          `concept personally. If there's a fit, you'll hear from us directly.`,
          ``,
          `For your records, here's what you sent:`,
          ``,
          ...detailLines,
          ``,
          `— ThinkShift`,
        ].join("\n"),
        // If the applicant hits reply, it goes back to Wayne.
        replyTo: { address: sender, name: "ThinkShift" },
      });

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
