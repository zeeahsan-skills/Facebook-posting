"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { card } from "../../components/ui";

type Health = {
  queue: {
    paused: boolean;
    byStatus: Record<string, number>;
    overdue: number;
    stuckProcessing: number;
    total: number;
  };
  posting_note: string;
  recentErrors: { event: string; detail: string | null; at: string }[];
  lastActivity: string | null;
  storage: Record<string, number>;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-sky-500/15 text-sky-300",
  queued: "bg-zinc-500/15 text-zinc-300",
  processing: "bg-indigo-500/15 text-indigo-300",
  submitted: "bg-violet-500/15 text-violet-300",
  published: "bg-emerald-500/15 text-emerald-300",
  pending_approval: "bg-amber-500/15 text-amber-300",
  manual_action: "bg-orange-500/15 text-orange-300",
  failed: "bg-red-500/15 text-red-300",
  skipped: "bg-zinc-500/15 text-zinc-500",
  cancelled: "bg-zinc-500/15 text-zinc-500",
  needs_review: "bg-yellow-500/15 text-yellow-300",
};

export default function WorkerHealthPage() {
  const [h, setH] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setH);
  }, []);

  if (!h) return <Shell><p className="text-sm text-zinc-500">Loading…</p></Shell>;

  const queueOk = !h.queue.paused && h.queue.stuckProcessing === 0;

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Worker Health</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Cloud-side queue and database health. Last activity:{" "}
        {h.lastActivity ? new Date(h.lastActivity).toLocaleString() : "never"}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={card}>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Queue state</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${queueOk ? "bg-emerald-400" : "bg-amber-400"}`} />
            <p className="font-semibold">{h.queue.paused ? "Paused" : queueOk ? "Healthy" : "Needs attention"}</p>
          </div>
          <p className="mt-1 text-sm text-zinc-400">{h.queue.total} total tasks</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Overdue</p>
          <p className="mt-2 text-2xl font-bold">{h.queue.overdue}</p>
          <p className="text-sm text-zinc-400">tasks past scheduled time</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Stuck processing</p>
          <p className="mt-2 text-2xl font-bold">{h.queue.stuckProcessing}</p>
          <p className="text-sm text-zinc-400">tasks claimed but never finished</p>
        </div>
      </div>

      <div className={`${card} mt-4`}>
        <p className="mb-3 text-sm font-semibold text-zinc-200">Tasks by status</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(h.queue.byStatus).map(([s, n]) => (
            <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[s] || STATUS_COLORS.queued}`}>
              {s.replace(/_/g, " ")}: {n}
            </span>
          ))}
          {Object.keys(h.queue.byStatus).length === 0 && (
            <p className="text-sm text-zinc-500">No tasks yet.</p>
          )}
        </div>
      </div>

      <div className={`${card} mt-4`}>
        <p className="mb-3 text-sm font-semibold text-zinc-200">Storage</p>
        <div className="grid grid-cols-3 gap-3 text-center md:grid-cols-6">
          {Object.entries(h.storage).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-zinc-950/60 p-3">
              <p className="text-xl font-bold">{v}</p>
              <p className="text-xs text-zinc-500">{k}</p>
            </div>
          ))}
        </div>
      </div>

      {h.recentErrors.length > 0 && (
        <div className={`${card} mt-4`}>
          <p className="mb-3 text-sm font-semibold text-zinc-200">Recent errors</p>
          <div className="space-y-2">
            {h.recentErrors.map((e, i) => (
              <div key={i} className="rounded-lg bg-red-500/10 p-3 text-sm">
                <p className="font-medium text-red-300">{e.event}</p>
                {e.detail && <p className="text-zinc-400">{e.detail}</p>}
                <p className="mt-1 text-xs text-zinc-500">{new Date(e.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
        <b>Where posting actually happens:</b> {h.posting_note}
      </div>
    </Shell>
  );
}
