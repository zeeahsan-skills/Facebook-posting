import { getTasks, getLog, groupNameFromUrl, Task } from "../lib/sheet";

export const dynamic = "force-dynamic";

function statusStyle(s: string) {
  const t = s.toLowerCase();
  if (t === "posted") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (t === "failed") return "bg-red-500/15 text-red-300 border-red-500/30";
  if (t === "pending") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
}

function eventStyle(e: string) {
  if (e === "POSTED") return "text-emerald-300";
  if (e.startsWith("FAILED")) return "text-red-300";
  if (e === "QUEUED") return "text-sky-300";
  if (e === "CLAIMED") return "text-violet-300";
  return "text-zinc-400";
}

export default async function Home() {
  let tasks: Task[] = [];
  let log: Awaited<ReturnType<typeof getLog>> = [];
  let error = "";
  try {
    [tasks, log] = await Promise.all([getTasks(), getLog()]);
  } catch (e: any) {
    error = e.message || "Could not load sheet data";
  }

  const posted = tasks.filter((t) => t.status.toLowerCase() === "posted").length;
  const failed = tasks.filter((t) => t.status.toLowerCase() === "failed").length;
  const pending = tasks.filter((t) => !t.status || t.status.toLowerCase() === "pending").length;

  const cards = [
    { label: "Total Groups", value: tasks.length, color: "text-zinc-100" },
    { label: "Posted", value: posted, color: "text-emerald-300" },
    { label: "Pending", value: pending, color: "text-amber-300" },
    { label: "Failed", value: failed, color: "text-red-300" },
  ];

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              FB Group Posting
            </span>{" "}
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Live campaign status from your Google Sheet · auto-refreshes every minute
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            <p className="font-semibold">Sheet not reachable</p>
            <p className="mt-1 text-red-300/80">{error}</p>
            <p className="mt-3 text-zinc-400">
              Fix: open the Google Sheet → Share → "Anyone with the link" → Viewer.
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"
                >
                  <p className="text-xs uppercase tracking-wider text-zinc-500">{c.label}</p>
                  <p className={`mt-2 text-4xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Groups &amp; Tasks</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Group</th>
                      <th className="px-4 py-3">Caption</th>
                      <th className="px-4 py-3">Scheduled</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Post Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.row} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                        <td className="px-4 py-3">
                          <a href={t.groupUrl} target="_blank" rel="noreferrer"
                             className="text-sky-300 hover:underline">
                            {groupNameFromUrl(t.groupUrl)}
                          </a>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-zinc-400" title={t.caption}>
                          {t.caption.split("\n")[0].slice(0, 60)}…
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {t.date || t.time ? `${t.date} ${t.time}`.trim() : "ASAP"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle(t.status || "pending")}`}>
                            {t.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.postLink ? (
                            <a href={t.postLink} target="_blank" rel="noreferrer"
                               className="text-sky-300 hover:underline">View post</a>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Thinking &amp; Decisions Log</h2>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
                {log.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-500">No decisions logged yet.</p>
                ) : (
                  <ul className="max-h-96 overflow-y-auto">
                    {log.slice(0, 50).map((e, i) => (
                      <li key={i} className="flex items-baseline gap-3 border-b border-zinc-800/50 px-4 py-2.5 text-sm last:border-0">
                        <span className="shrink-0 text-xs text-zinc-500">{e.timestamp}</span>
                        <span className={`shrink-0 font-mono text-xs font-semibold ${eventStyle(e.event)}`}>
                          {e.event}
                        </span>
                        <span className="truncate text-zinc-400" title={e.detail}>
                          {e.taskId} — {e.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <footer className="mt-10 text-center text-xs text-zinc-600">
              Decision engine: deterministic · No AI guessing · Queue: persistent
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
