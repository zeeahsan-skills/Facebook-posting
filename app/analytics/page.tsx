"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { btnGhost, card, th, td } from "../../components/ui";

type Stats = {
  totalClicks: number;
  clicksPerDay: Record<string, number>;
  clicksPerCampaign: { name: string; clicks: number }[];
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const days = Object.keys(stats?.clicksPerDay || {}).sort();
  const maxClicks = Math.max(1, ...days.map((d) => stats!.clicksPerDay[d]));
  const total = stats?.totalClicks ?? 0;

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Click Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real tracked clicks only — never estimated. Clicks are counted when someone opens your tracking link.
          </p>
        </div>
        <a href="/api/export?type=clicks" className={btnGhost}>Export CSV</a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Total Clicks</p>
          <p className="mt-2 text-4xl font-bold text-sky-300">{total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Active Days</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">{days.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Campaigns with Clicks</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">{stats?.clicksPerCampaign.length ?? 0}</p>
        </div>
      </div>

      <div className={`${card} mt-6`}>
        <h2 className="mb-4 font-semibold">Clicks Over Time</h2>
        {days.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No clicks yet. Your tracking links look like:<br />
            <code className="text-sky-300">your-site.vercel.app/api/track/&lt;code&gt;</code><br />
            <span className="text-zinc-600">Each campaign gets its own code automatically.</span>
          </p>
        ) : (
          <div className="flex h-48 items-end gap-1.5">
            {days.map((d) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}: ${stats!.clicksPerDay[d]} clicks`}>
                <span className="text-xs font-semibold text-sky-300">{stats!.clicksPerDay[d]}</span>
                <div className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-fuchsia-500"
                  style={{ height: `${(stats!.clicksPerDay[d] / maxClicks) * 100}%`, minHeight: 6 }} />
                <span className="text-[10px] text-zinc-600">{d.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${card} mt-6`}>
        <h2 className="mb-4 font-semibold">Performance by Campaign</h2>
        {(stats?.clicksPerCampaign || []).length === 0 ? (
          <p className="text-sm text-zinc-500">No data yet.</p>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              <th className={th}>Campaign</th><th className={th}>Clicks</th><th className={th}>Share</th>
            </tr></thead>
            <tbody>
              {stats!.clicksPerCampaign.map((c, i) => (
                <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                  <td className={td}>{c.name}</td>
                  <td className={`${td} font-semibold text-sky-300`}>{c.clicks}</td>
                  <td className={td}>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                        style={{ width: `${total ? (c.clicks / total) * 100 : 0}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-4 text-xs text-zinc-600">
          Note: clicks are attributed to campaigns (via tracking link), not to individual groups.
          A group-level claim would require per-group links, which the tool can generate on request.
        </p>
      </div>
    </Shell>
  );
}
