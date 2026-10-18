"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, btnGhost, btnDanger, card, label, th, td } from "../../components/ui";

type Profile = {
  id: string; label: string; fb_name: string | null; notes: string | null;
  enabled: boolean; health: string; last_activity: string | null;
  last_error: string | null; created_at: string;
};

const HEALTH: Record<string, { label: string; cls: string }> = {
  ok: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-300" },
  locked: { label: "Locked", cls: "bg-red-500/15 text-red-300" },
  restricted: { label: "Restricted", cls: "bg-amber-500/15 text-amber-300" },
  unknown: { label: "Unknown", cls: "bg-zinc-500/15 text-zinc-400" },
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [max, setMax] = useState(5);
  const [label, setLabel] = useState("");
  const [fbName, setFbName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data.profiles || []);
    setMax(data.max || 5);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!label.trim()) return;
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, fb_name: fbName, notes }),
    });
    if (res.ok) {
      setLabel(""); setFbName(""); setNotes("");
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add profile");
    }
  }

  async function toggle(p: Profile) {
    await fetch(`/api/profiles/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !p.enabled }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this profile? Its groups and campaigns stay, but won't be linked to it.")) return;
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    load();
  }

  async function setHealth(p: Profile, health: string) {
    await fetch(`/api/profiles/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ health }),
    });
    load();
  }

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Account Profiles</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Track up to {max} Facebook profiles. Posting itself always runs through your
        local browser session — a profile here is an <b className="text-zinc-200">inventory record</b>,
        not a cloud login. Never enter passwords here.
      </p>

      <div className={`${card} mb-6`}>
        <h2 className="mb-4 text-sm font-semibold text-zinc-200">Add profile ({profiles.length}/{max})</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={label}>Label *</label>
            <input className={input} placeholder="e.g. Main account" value={label}
              onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className={label}>Facebook name</label>
            <input className={input} placeholder="e.g. Janet Morales" value={fbName}
              onChange={(e) => setFbName(e.target.value)} />
          </div>
          <div>
            <label className={label}>Notes</label>
            <input className={input} placeholder="Optional notes" value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <button onClick={add} className={`${btn} mt-4`} disabled={profiles.length >= max || !label.trim()}>
          Add profile
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : profiles.length === 0 ? (
        <div className={`${card} text-center text-sm text-zinc-500`}>
          No profiles yet. Add your first Facebook profile above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => {
            const h = HEALTH[p.health] || HEALTH.unknown;
            return (
              <div key={p.id} className={card}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{p.label}</h3>
                    {p.fb_name && <p className="text-sm text-zinc-400">{p.fb_name}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${h.cls}`}>
                    {h.label}
                  </span>
                </div>
                {p.notes && <p className="mt-2 text-sm text-zinc-500">{p.notes}</p>}
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                  <span className={`inline-block h-2 w-2 rounded-full ${p.enabled ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {p.enabled ? "Posting enabled" : "Paused"}
                  {p.last_activity && <span>· last activity {new Date(p.last_activity).toLocaleString()}</span>}
                </div>
                {p.last_error && (
                  <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-300">{p.last_error}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => toggle(p)} className={btnGhost}>
                    {p.enabled ? "Pause" : "Enable"}
                  </button>
                  <select
                    value={p.health}
                    onChange={(e) => setHealth(p, e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300"
                  >
                    <option value="ok">Mark healthy</option>
                    <option value="locked">Mark locked</option>
                    <option value="restricted">Mark restricted</option>
                    <option value="unknown">Mark unknown</option>
                  </select>
                  <button onClick={() => remove(p.id)} className={btnDanger}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        <b>Important:</b> if Facebook locks or restricts an account, mark it here and pause it.
        The agent never switches accounts automatically to evade a restriction.
      </div>
    </Shell>
  );
}
