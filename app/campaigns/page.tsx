"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, btnGhost, card, label, th, td } from "../../components/ui";

type Campaign = {
  id: string; name: string; caption: string; destination_url: string;
  tracking_code: string; enabled: boolean;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", caption: "", destination_url: "", enabled: true });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", caption: "", destination_url: "", enabled: true });
    setShowForm(true); setError("");
  }
  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({ name: c.name, caption: c.caption, destination_url: c.destination_url, enabled: c.enabled });
    setShowForm(true); setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch(editing ? `/api/campaigns/${editing.id}` : "/api/campaigns", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); return; }
    setShowForm(false); load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this campaign and its tasks?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  async function toggle(c: Campaign) {
    await fetch(`/api/campaigns/${c.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !c.enabled }),
    });
    load();
  }

  function trackingUrl(code: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/track/${code}`;
  }

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Manager</h1>
          <p className="mt-1 text-sm text-zinc-400">{campaigns.length} campaigns</p>
        </div>
        <button onClick={openAdd} className={btn}>+ New Campaign</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submit} className={`${card} max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto`}>
            <h2 className="text-lg font-semibold">{editing ? "Edit Campaign" : "New Campaign"}</h2>
            <div><span className={label}>Campaign Name</span>
              <input className={input} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Polish Caregiver Jobs" /></div>
            <div><span className={label}>Caption (posted exactly as written)</span>
              <textarea className={input} required rows={5} value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Your post text…" /></div>
            <div><span className={label}>Destination URL</span>
              <input className={input} required value={form.destination_url}
                onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                placeholder="https://…" /></div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="h-4 w-4 accent-indigo-600" />
              Campaign enabled
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" className={btn}>{editing ? "Save" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? <p className="text-zinc-500">Loading…</p> :
          campaigns.length === 0 ? (
            <div className={`${card} text-center text-zinc-500`}>
              No campaigns yet. Create your first campaign to start posting.
            </div>
          ) : campaigns.map((c) => (
            <div key={c.id} className={card}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="mt-1 max-w-2xl whitespace-pre-line text-sm text-zinc-400">
                    {c.caption.slice(0, 200)}{c.caption.length > 200 ? "…" : ""}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Tracking link: <code className="text-sky-300">{trackingUrl(c.tracking_code)}</code>
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  c.enabled ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-zinc-500/30 bg-zinc-500/15 text-zinc-400"
                }`}>
                  {c.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`/scheduler?campaign=${c.id}`} className={btn}>Schedule Posts</a>
                <button onClick={() => toggle(c)} className={btnGhost}>
                  {c.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => openEdit(c)} className={btnGhost}>Edit</button>
                <button onClick={() => remove(c.id)} className={btnGhost}>Delete</button>
              </div>
            </div>
          ))}
      </div>
    </Shell>
  );
}
