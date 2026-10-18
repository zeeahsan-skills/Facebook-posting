"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Shell from "../../components/Shell";
import { input, btn, card, label, th, td } from "../../components/ui";

type Campaign = { id: string; name: string; enabled: boolean };
type Group = { id: string; name: string; url: string };

function SchedulerInner() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("campaign") || "";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [campaignId, setCampaignId] = useState(preselected);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/campaigns"), fetch("/api/groups")]).then(async ([c, g]) => {
      const cd = await c.json(); const gd = await g.json();
      setCampaigns((cd.campaigns || []).filter((x: Campaign) => x.enabled));
      setGroups(gd.groups || []);
      if (preselected) setCampaignId(preselected);
    });
  }, [preselected]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    setSelected(selected.size === groups.length ? new Set() : new Set(groups.map((g) => g.id)));
  }

  async function schedule() {
    setError(""); setResult(""); setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          group_ids: [...selected],
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          timezone: "Asia/Karachi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(`✅ ${data.scheduled} task(s) scheduled${scheduledAt ? " for " + scheduledAt.replace("T", " ") : " (ASAP)"}.`);
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">Posting Scheduler</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Pick a campaign, select groups, optionally set a date/time. Duplicates are blocked automatically.
      </p>

      <div className={`${card} mb-6 space-y-4`}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className={label}>Campaign</span>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={input}>
              <option value="">Select campaign…</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Scheduled Date/Time (optional — empty = ASAP)</span>
            <input type="datetime-local" value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)} className={input} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>Groups ({selected.size} selected)</span>
            <button onClick={toggleAll} className="text-xs text-indigo-300 hover:underline">
              {selected.size === groups.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
            {groups.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-zinc-800/50">
                <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)}
                  className="h-4 w-4 accent-indigo-600" />
                <span className="text-zinc-200">{g.name}</span>
              </label>
            ))}
            {groups.length === 0 && <p className="p-2 text-sm text-zinc-500">No groups yet.</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {result && <p className="text-sm text-emerald-300">{result}</p>}

        <button onClick={schedule} disabled={loading || !campaignId || selected.size === 0} className={btn}>
          {loading ? "Scheduling…" : `Schedule ${selected.size} Post(s)`}
        </button>
      </div>

      <a href="/history" className="text-sm text-indigo-300 hover:underline">View scheduled tasks in Posting History →</a>
    </Shell>
  );
}

export default function SchedulerPage() {
  return (
    <Suspense fallback={<Shell><p>Loading…</p></Shell>}>
      <SchedulerInner />
    </Suspense>
  );
}
