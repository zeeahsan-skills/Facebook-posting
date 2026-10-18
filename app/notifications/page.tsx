"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { card } from "../../components/ui";

type LogRow = { id: string; event: string; detail: string | null; created_at: string };

function eventStyle(e: string) {
  if (e.includes("POSTED") || e.includes("PUBLISHED")) return "text-emerald-300";
  if (e.includes("FAIL")) return "text-red-300";
  if (e.includes("PAUSE")) return "text-amber-300";
  if (e.includes("SCHEDULE") || e.includes("QUEUED")) return "text-sky-300";
  return "text-zinc-400";
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => { setLogs(d.log || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">Notifications</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Every decision the agent makes — scheduled, posted, failed, retried, paused.
      </p>
      <div className={card}>
        {loading ? <p className="text-sm text-zinc-500">Loading…</p> :
          logs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No activity yet. The log fills up as the worker processes tasks.
            </p>
          ) : (
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
              {logs.map((l) => (
                <li key={l.id} className="flex items-baseline gap-3 border-b border-zinc-800/50 px-2 py-2.5 text-sm last:border-0">
                  <span className="shrink-0 text-xs text-zinc-500">
                    {l.created_at.slice(0, 16).replace("T", " ")}
                  </span>
                  <span className={`shrink-0 font-mono text-xs font-semibold ${eventStyle(l.event)}`}>
                    {l.event}
                  </span>
                  <span className="truncate text-zinc-400" title={l.detail || ""}>{l.detail}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Shell>
  );
}
