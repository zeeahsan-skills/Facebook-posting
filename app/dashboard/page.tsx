"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { card, th, td } from "../../components/ui";

type Stats = {
  groups: number; campaigns: number; totalClicks: number;
  tasksByStatus: Record<string, number>;
  clicksPerDay: Record<string, number>;
  clicksPerCampaign: { name: string; clicks: number }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => {
      setStats(d); setLoading(false);
    });
  }, []);

  const s = stats?.tasksByStatus || {};
  const cards = [
    { label: "Groups", value: stats?.groups ?? "—", color: "text-zinc-100" },
    { label: "Campaigns", value: stats?.campaigns ?? "—", color: "text-zinc-100" },
    { label: "Posted", value: s.posted ?? 0, color: "text-emerald-300" },
    { label: "Queued", value: s.queued ?? 0, color: "text-amber-300" },
    { label: "Failed", value: s.failed ?? 0, color: "text-red-300" },
    { label: "Total Clicks", value: stats?.totalClicks ?? 0, color: "text-sky-300" },
  ];

  const days = Object.keys(stats?.clicksPerDay || {}).sort().slice(-14);
  const maxClicks = Math.max(1, ...days.map((d) => stats!.clicksPerDay[d]));

  return (
    <Shell>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {loading ? <p className="text-zinc-500">Loading…</p> : (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">{c.label}</p>
                <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className={card}>
              <h2 className="mb-4 font-semibold">Clicks — last 14 days</h2>
              {days.length === 0 ? (
                <p className="text-sm text-zinc-500">No clicks tracked yet. Share your tracking links to start measuring.</p>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {days.map((d) => (
                    <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}: ${stats!.clicksPerDay[d]}`}>
                      <div className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-fuchsia-500"
                        style={{ height: `${(stats!.clicksPerDay[d] / maxClicks) * 100}%`, minHeight: 4 }} />
                      <span className="text-[9px] text-zinc-600">{d.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="mb-4 font-semibold">Clicks by Campaign</h2>
              {(stats?.clicksPerCampaign || []).length === 0 ? (
                <p className="text-sm text-zinc-500">No campaign clicks yet.</p>
              ) : (
                <table className="w-full">
                  <thead><tr className="border-b border-zinc-800">
                    <th className={th}>Campaign</th><th className={th}>Clicks</th>
                  </tr></thead>
                  <tbody>
                    {stats!.clicksPerCampaign.slice(0, 8).map((c, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                        <td className={td}>{c.name}</td>
                        <td className={`${td} font-semibold text-sky-300`}>{c.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <a href="/api/export?type=tasks" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Export Tasks CSV</a>
            <a href="/api/export?type=clicks" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Export Clicks CSV</a>
            <a href="/api/export?type=groups" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">Export Groups CSV</a>
          </div>
        </>
      )}
    </Shell>
  );
}
