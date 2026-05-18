"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SyncStatus() {
  const data = useQuery(api.users.me);

  if (data === undefined) {
    return (
      <div className="card p-6 text-sm text-muted">
        Loading your synced profile from Convex…
      </div>
    );
  }

  if (data === null || !data.user) {
    return (
      <div className="card p-6 text-sm text-muted">
        Your account hasn&apos;t synced to Convex yet. This happens via the
        Clerk webhook the first time your profile or membership changes.
      </div>
    );
  }

  return (
    <div className="card p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Synced from Clerk → Convex
      </p>
      <div className="mt-4 space-y-1 text-sm">
        <p>
          <span className="text-muted">Name:</span>{" "}
          {data.user.name ?? "—"}
        </p>
        <p>
          <span className="text-muted">Email:</span>{" "}
          {data.user.email ?? "—"}
        </p>
      </div>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-accent">
        Organizations ({data.organizations.length})
      </p>
      <ul className="mt-3 space-y-2">
        {data.organizations.map((o) => (
          <li
            key={o!._id}
            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <span>{o!.name}</span>
            <span className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent">
              {o!.role}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
