"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btnGhost, th, td } from "../../components/ui";

type Task = {
  id: string; status: string; scheduled_at: string | null;
  post_link: string | null; error: string | null; attempts: number;
  created_at: string; plan_reason: string | null;
  groups: { name: string } | null;
  campaigns: { name: string } | null;
};

const STATUSES = ["", "scheduled", "queued", "processing", "submitted", "published",
  "pending_approval", "manual_action", "failed", "skipped", "cancelled", "needs_review"];

function statusStyle(s: string) {
  switch (s) {
    case "published": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "failed": return "bg-red-500/15 text-red-300 border-red-500/30";
    case "processing": case "submitted":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    case "pending_approval": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "manual_action": return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    case "scheduled": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default: return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  }
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(status = "") {
    setLoading(true);
    const res = await fetch(`/api/tasks${status ? `?status=${status}` : ""}`);
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function retry(id: string) {
    if (!confirm("Retry this task?")) return;
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry" }),
    });
    load(filter);
  }

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posting History</h1>
        <a href="/api/export?type=tasks" className={btnGhost}>Export CSV</a>
      </div>

      <div className="mb-4 flex gap-3">
        <select value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}
          className={`${input} max-w-xs`}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "" ? "All statuses" : s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800 bg-zinc-900/70">
            <th className={th}>Date</th><th className={th}>Campaign</th><th className={th}>Group</th>
            <th className={th}>Status</th><th className={th}>Attempts</th><th className={th}>Result</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td className={td} colSpan={7}>Loading…</td></tr> :
              tasks.length === 0 ? (
                <tr><td className={`${td} text-zinc-500`} colSpan={7}>No tasks yet. Schedule some from the Campaign Manager.</td></tr>
              ) : tasks.map((t) => (
                <>
                <tr key={t.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                  <td className={`${td} whitespace-nowrap text-zinc-400`}>{t.created_at.slice(0, 16).replace("T", " ")}</td>
                  <td className={td}>{t.campaigns?.name || "—"}</td>
                  <td className={td}>{t.groups?.name || "—"}</td>
                  <td className={td}>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle(t.status)}`}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className={`${td} text-zinc-400`}>{t.attempts}</td>
                  <td className={`${td} max-w-xs truncate text-zinc-400`}>
                    {t.post_link ? (
                      <a href={t.post_link} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline">View post</a>
                    ) : t.error ? <span className="text-red-300/80" title={t.error}>{t.error.slice(0, 60)}</span> : "—"}
                  </td>
                  <td className={td}>
                    <div className="flex gap-2">
                      {t.plan_reason && (
                        <button onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                          className="text-xs text-amber-300 hover:underline" title="Why was this task selected?">
                          🧠 Why?
                        </button>
                      )}
                      {t.status === "failed" && (
                        <button onClick={() => retry(t.id)} className="text-xs text-indigo-300 hover:underline">Retry</button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === t.id && t.plan_reason && (
                  <tr key={t.id + "-why"} className="border-b border-zinc-800/60 bg-amber-500/5">
                    <td colSpan={7} className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">🧠 Agent planning trace</p>
                      <p className="mt-1 text-sm text-zinc-300">{t.plan_reason}</p>
                    </td>
                  </tr>
                )}
                </>
              ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
