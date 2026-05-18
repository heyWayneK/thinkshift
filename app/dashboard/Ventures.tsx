"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const STATUSES = ["idea", "building", "live", "archived"] as const;

export default function Ventures() {
  const { orgId } = useAuth();
  const arg = orgId ? { clerkOrgId: orgId } : "skip";

  const ventures = useQuery(api.ventures.list, arg);
  const roleInfo = useQuery(api.ventures.myOrgRole, arg);
  const create = useMutation(api.ventures.create);
  const setStatus = useMutation(api.ventures.setStatus);
  const remove = useMutation(api.ventures.remove);
  const addNote = useMutation(api.ventures.addNote);

  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const isAdmin = roleInfo?.role === "org:admin";

  const guard = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message.replace(/^.*AuthError:\s*/, ""));
    }
  };

  if (!orgId) {
    return (
      <div className="card p-6 text-sm text-muted">
        Select an organization to manage ventures.
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Ventures (role-gated)
        </p>
        <span className="text-xs text-muted">
          You: {roleInfo?.role ? roleInfo.role.replace("org:", "") : "…"}
        </span>
      </div>

      {isAdmin && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            guard(async () => {
              await create({ clerkOrgId: orgId, title });
              setTitle("");
            });
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New venture title (admin only)"
            className="flex-1 rounded-lg border border-white/15 bg-[#15181d] px-3 py-2 text-sm outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            className="btn-primary rounded-lg px-4 py-2 text-sm"
          >
            Create
          </button>
        </form>
      )}

      {err && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {err}
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {ventures === undefined && (
          <li className="text-sm text-muted">Loading…</li>
        )}
        {ventures?.length === 0 && (
          <li className="text-sm text-muted">
            No ventures yet{isAdmin ? " — create one above." : "."}
          </li>
        )}
        {ventures?.map((vt) => (
          <li
            key={vt._id}
            className="rounded-lg border border-white/10 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">{vt.title}</span>
              {isAdmin ? (
                <select
                  value={vt.status}
                  onChange={(e) =>
                    guard(() =>
                      setStatus({
                        ventureId: vt._id,
                        status: e.target
                          .value as (typeof STATUSES)[number],
                      }),
                    )
                  }
                  className="rounded border border-white/15 bg-[#15181d] px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted">
                  {vt.status}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() =>
                    guard(() => remove({ ventureId: vt._id }))
                  }
                  className="ml-auto rounded border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>

            {vt.notes.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs text-muted">
                {vt.notes.map((n, i) => (
                  <li key={i}>
                    <span className="text-foreground">
                      {n.authorName ?? "Member"}:
                    </span>{" "}
                    {n.text}
                  </li>
                ))}
              </ul>
            )}

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget
                  .elements[0] as HTMLInputElement;
                const text = input.value;
                if (!text.trim()) return;
                guard(async () => {
                  await addNote({ ventureId: vt._id, text });
                  input.value = "";
                });
              }}
            >
              <input
                placeholder="Add a note (any member)"
                className="flex-1 rounded border border-white/10 bg-[#15181d] px-2 py-1 text-xs outline-none focus:border-accent/50"
              />
              <button
                type="submit"
                className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/5"
              >
                Note
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
