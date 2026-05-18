"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import nodemailer from "nodemailer";

const MAX_ATTEMPTS = 3;

/**
 * INTERNAL — sends the joint-venture application notification via MS365 SMTP.
 * Enqueued by applications.submit through the Convex scheduler (the queue).
 * On failure it records the error and retries with backoff up to 3 attempts.
 *
 * Requires these env vars on the Convex deployment:
 *   MS356_EMAIL_SERVER_HOST, _PORT, _USER, _PASSWORD
 */
export const sendApplication = internalAction({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const app = await ctx.runQuery(internal.applications.getForEmail, {
      applicationId,
    });
    if (!app || app.status === "sent") return;

    const host = process.env.MS356_EMAIL_SERVER_HOST;
    const port = Number(process.env.MS356_EMAIL_SERVER_PORT ?? 587);
    const user = process.env.MS356_EMAIL_SERVER_USER;
    const pass = process.env.MS356_EMAIL_SERVER_PASSWORD;

    if (!host || !user || !pass) {
      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "failed",
        error: "MS365 SMTP env vars are not set on the Convex deployment",
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 587 => STARTTLS
        requireTLS: port === 587,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"ThinkShift Applications" <${user}>`,
        to: user,
        replyTo: `"${app.name}" <${app.email}>`,
        subject: `JV application — ${app.name}`,
        text: [
          `New joint-venture application.`,
          ``,
          `Name:  ${app.name}`,
          `Email: ${app.email}`,
          ``,
          `Niche / community:`,
          app.background || "(not provided)",
          ``,
          `Concept:`,
          app.concept,
        ].join("\n"),
      });

      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "sent",
      });
    } catch (e) {
      const message = (e as Error).message ?? "Unknown SMTP error";
      await ctx.runMutation(internal.applications.markStatus, {
        applicationId,
        status: "failed",
        error: message,
      });

      // attempts was incremented by markStatus; retry with backoff.
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
