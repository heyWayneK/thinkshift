"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirror of the server checks so most errors never hit the server. */
function clientValidate(v: {
  name: string;
  email: string;
  concept: string;
}): string | null {
  if (v.name.trim().length < 2) return "Please enter your name.";
  if (!EMAIL_RE.test(v.email.trim()))
    return "Please enter a valid email address.";
  if (v.concept.trim().length < 20)
    return "Tell us a bit more about your concept (at least 20 characters).";
  return null;
}

/** Pull the clean message out of a ConvexError payload. */
function messageFrom(err: unknown): string {
  if (err instanceof ConvexError) {
    const d = err.data as { message?: string } | string;
    if (typeof d === "string") return d;
    if (d?.message) return d.message;
  }
  return "Something went wrong. Please try again.";
}

export default function ApplyForm() {
  const submit = useMutation(api.applications.submit);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="card mx-auto mt-10 max-w-xl p-8 text-center">
        <p className="text-lg font-semibold text-gradient">
          Application received.
        </p>
        <p className="mt-2 text-muted">
          We read every concept personally. If there&apos;s a fit, you&apos;ll
          hear from us directly.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card mx-auto mt-10 max-w-xl space-y-4 p-6 text-left sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const f = e.currentTarget;
        const data = new FormData(f);
        const fields = {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          background: String(data.get("background") ?? ""),
          concept: String(data.get("concept") ?? ""),
          website: String(data.get("website") ?? ""),
        };

        const localError = clientValidate(fields);
        if (localError) {
          setError(localError);
          return;
        }

        setSending(true);
        try {
          await submit(fields);
          setDone(true);
        } catch (err) {
          setError(messageFrom(err));
        } finally {
          setSending(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-muted">Your name</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#15181d] px-3 py-2 text-sm outline-none focus:border-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#15181d] px-3 py-2 text-sm outline-none focus:border-accent/50"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-muted">
          Your niche &amp; community inroads
        </span>
        <input
          name="background"
          placeholder="e.g. 12 yrs in commercial HVAC; run a 9k-member installer network"
          className="mt-1 w-full rounded-lg border border-white/15 bg-[#15181d] px-3 py-2 text-sm outline-none focus:border-accent/50"
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Your concept</span>
        <textarea
          name="concept"
          required
          minLength={20}
          rows={5}
          placeholder="The gap you see, who buys, and why you're the one to win it."
          className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-[#15181d] px-3 py-2 text-sm outline-none focus:border-accent/50"
        />
      </label>

      {/* honeypot — hidden from humans */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full rounded-xl px-6 py-3.5 text-base disabled:opacity-60"
      >
        {sending ? "Sending…" : "Apply for a Joint-Venture Partnership"}
      </button>
      <p className="text-center text-xs text-muted">
        No fees, no pitches for hire. We invest our build into shared ventures.
      </p>
    </form>
  );
}
