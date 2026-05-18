"use client";

import { useState, useTransition } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setMemberRole, removeMember } from "./actions";

const ADMIN = "org:admin";
const MEMBER = "org:member";

export default function AdminDirectory() {
  const data = useQuery(api.admin.directory);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(
    null,
  );

  if (data === undefined) {
    return (
      <div className="card p-6 text-sm text-muted">Loading directory…</div>
    );
  }

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setMsg(null);
      const res = await fn();
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error ?? "Action failed" });
      } else {
        setMsg({
          kind: "ok",
          text: "Done — syncing from Clerk (updates in a moment).",
        });
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm text-muted">
        <span className="card px-4 py-2">
          Orgs:{" "}
          <strong className="text-foreground">
            {data.organizations.length}
          </strong>
        </span>
        <span className="card px-4 py-2">
          Users:{" "}
          <strong className="text-foreground">{data.totalUsers}</strong>
        </span>
        <span className="card px-4 py-2">
          Unassigned:{" "}
          <strong className="text-foreground">
            {data.orphanUsers.length}
          </strong>
        </span>
      </div>

      {msg && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            msg.kind === "err"
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {msg.text}
        </div>
      )}

      {data.organizations.map((org) => (
        <div key={org.clerkOrgId} className="card p-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{org.name}</h3>
            {org.isPersonal && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                personal
              </span>
            )}
            {org.clerkOrgId === data.superadminOrgId && (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                superadmin org
              </span>
            )}
            <span className="ml-auto text-xs text-muted">
              {org.members.length} member
              {org.members.length === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="mt-4 divide-y divide-white/5">
            {org.members.map((m) => {
              const isAdmin = m.role === ADMIN;
              return (
                <li
                  key={m.clerkUserId}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {m.name ?? m.email ?? m.clerkUserId}
                    </p>
                    {m.email && m.name && (
                      <p className="truncate text-xs text-muted">
                        {m.email}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      isAdmin
                        ? "bg-accent/10 text-accent"
                        : "bg-white/5 text-muted"
                    }`}
                  >
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      disabled={isPending}
                      onClick={() =>
                        run(() =>
                          setMemberRole(
                            org.clerkOrgId,
                            m.clerkUserId,
                            isAdmin ? MEMBER : ADMIN,
                          ),
                        )
                      }
                      className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-white/5 disabled:opacity-50"
                    >
                      {isAdmin ? "Demote to member" : "Promote to admin"}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() =>
                        run(() =>
                          removeMember(org.clerkOrgId, m.clerkUserId),
                        )
                      }
                      className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
            {org.members.length === 0 && (
              <li className="py-3 text-sm text-muted">No members.</li>
            )}
          </ul>
        </div>
      ))}

      {data.orphanUsers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold">Users with no organization</h3>
          <p className="mt-1 text-xs text-muted">
            These should be transient — auto-org runs on signup once the
            webhook is verified.
          </p>
          <ul className="mt-4 divide-y divide-white/5">
            {data.orphanUsers.map((u) => (
              <li key={u.clerkUserId} className="py-3 text-sm">
                {u.name ?? u.email ?? u.clerkUserId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
