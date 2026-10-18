"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, btnGhost, btnDanger, card, label, th, td } from "../../components/ui";

type Group = { id: string; name: string; url: string; country: string | null; category: string | null };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: "", url: "", country: "", category: "" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(data.groups || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", url: "", country: "", category: "" });
    setShowForm(true);
    setError("");
  }
  function openEdit(g: Group) {
    setEditing(g);
    setForm({ name: g.name, url: g.url, country: g.country || "", category: g.category || "" });
    setShowForm(true);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/groups/${editing.id}` : "/api/groups";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); return; }
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this group?")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = groups.filter((g) =>
    (g.name + g.url + (g.country || "")).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facebook Groups</h1>
          <p className="mt-1 text-sm text-zinc-400">{groups.length} groups saved</p>
        </div>
        <button onClick={openAdd} className={btn}>+ Add Group</button>
      </div>

      <input
        placeholder="Search groups…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${input} mb-4 max-w-sm`}
      />

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submit} className={`${card} w-full max-w-md space-y-4`}>
            <h2 className="text-lg font-semibold">{editing ? "Edit Group" : "Add Group"}</h2>
            <div><span className={label}>Group Name</span>
              <input className={input} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Opieka nad osobami starszymi" /></div>
            <div><span className={label}>Group URL</span>
              <input className={input} required value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.facebook.com/groups/…" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className={label}>Country</span>
                <input className={input} value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. Poland" /></div>
              <div><span className={label}>Category</span>
                <input className={input} value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Caregivers" /></div>
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" className={btn}>{editing ? "Save" : "Add"}</button>
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800 bg-zinc-900/70">
            <th className={th}>Name</th><th className={th}>URL</th>
            <th className={th}>Country</th><th className={th}>Category</th><th className={th}></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td className={td} colSpan={5}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className={`${td} text-zinc-500`} colSpan={5}>
                No groups yet. Add one or <a href="/import" className="text-indigo-300 hover:underline">import from CSV</a>.
              </td></tr>
            ) : filtered.map((g) => (
              <tr key={g.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                <td className={td}>{g.name}</td>
                <td className={td}><a href={g.url} target="_blank" rel="noreferrer"
                  className="text-sky-300 hover:underline">{g.url.slice(0, 45)}…</a></td>
                <td className={`${td} text-zinc-400`}>{g.country || "—"}</td>
                <td className={`${td} text-zinc-400`}>{g.category || "—"}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <button onClick={() => openEdit(g)} className="mr-2 text-xs text-indigo-300 hover:underline">Edit</button>
                  <button onClick={() => remove(g.id)} className="text-xs text-red-300 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
