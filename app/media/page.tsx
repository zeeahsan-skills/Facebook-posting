"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, btnDanger, card, label } from "../../components/ui";

type Asset = {
  id: string; campaign_id: string | null; filename: string;
  url: string; size: number; uploaded_at: string;
};
type Campaign = { id: string; name: string };

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [a, c] = await Promise.all([
      fetch("/api/assets").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()),
    ]);
    setAssets(a.assets || []);
    setCampaigns(c.campaigns || []);
  }
  useEffect(() => { load(); }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (campaignId) form.append("campaign_id", campaignId);
      const res = await fetch("/api/assets", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this image from the library?")) return;
    await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
    load();
  }

  function campName(id: string | null) {
    return campaigns.find((c) => c.id === id)?.name || "—";
  }

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Image Library</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Upload campaign images (max 4MB each). Stored in your private Blob store.
        Attach them to campaigns to keep creative assets organized.
      </p>

      <div className={`${card} mb-6`}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={label}>Attach to campaign (optional)</label>
            <select className={input} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Choose image</label>
            <input type="file" accept="image/*" onChange={upload} disabled={uploading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-white" />
          </div>
        </div>
        {uploading && <p className="mt-3 text-sm text-zinc-500">Uploading…</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {assets.length === 0 ? (
        <div className={`${card} text-center text-sm text-zinc-500`}>
          No images yet. Upload your first campaign image above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className={card}>
              <a href={a.url} target="_blank" rel="noreferrer">
                <img src={a.url} alt={a.filename}
                  className="h-40 w-full rounded-lg object-cover" loading="lazy" />
              </a>
              <p className="mt-3 truncate text-sm font-medium text-zinc-200" title={a.filename}>
                {a.filename}
              </p>
              <p className="text-xs text-zinc-500">
                {campName(a.campaign_id)} · {(a.size / 1024).toFixed(0)} KB ·{" "}
                {new Date(a.uploaded_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                <a href={a.url} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">
                  Open full
                </a>
                <button onClick={() => remove(a.id)} className={btnDanger}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
