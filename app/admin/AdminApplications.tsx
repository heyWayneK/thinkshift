"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-white/5 text-muted",
  sent: "bg-accent/10 text-accent",
  failed: "bg-red-500/10 text-red-300",
};

export default function AdminApplications() {
  const apps = useQuery(api.applications.list);

  if (apps === undefined) {
    return (
      <div className="card p-6 text-sm text-muted">Loading applications…</div>
    );
  }

  return (
    <div className="card p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        JV applications ({apps.length})
      </p>
      {apps.length === 0 && (
        <p className="mt-4 text-sm text-muted">No applications yet.</p>
      )}
      <ul className="mt-4 space-y-3">
        {apps.map((a) => (
          <li key={a._id} className="rounded-lg border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">{a.name}</span>
              <a
                href={`mailto:${a.email}`}
                className="text-xs text-accent hover:underline"
              >
                {a.email}
              </a>
              <span
                className={`ml-auto rounded px-2 py-0.5 text-xs ${
                  STATUS_STYLES[a.status] ?? "bg-white/5 text-muted"
                }`}
              >
                {a.status}
                {a.status === "failed" && a.attempts > 0
                  ? ` (${a.attempts}x)`
                  : ""}
              </span>
            </div>
            {a.background && (
              <p className="mt-2 text-xs text-muted">{a.background}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm">{a.concept}</p>
            {a.status === "failed" && a.error && (
              <p className="mt-2 text-xs text-red-300">SMTP: {a.error}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
