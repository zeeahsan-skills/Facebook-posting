"use client";
import { useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, card, label } from "../../components/ui";

export default function ImportPage() {
  const [csv, setCsv] = useState("name,url,country,category\n");
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function submit() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">Import Spreadsheet</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Paste CSV or upload a file. Required columns: <code className="text-zinc-200">name</code>,{" "}
        <code className="text-zinc-200">url</code>. Optional:{" "}
        <code className="text-zinc-200">country</code>, <code className="text-zinc-200">category</code>.
      </p>

      <div className={`${card} space-y-4`}>
        <div>
          <span className={label}>Upload CSV file</span>
          <input type="file" accept=".csv,.txt" onChange={handleFile}
            className="text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500" />
        </div>
        <div>
          <span className={label}>Or paste CSV</span>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10}
            className={`${input} font-mono text-xs`} />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button onClick={submit} disabled={loading} className={btn}>
          {loading ? "Importing…" : "Import Groups"}
        </button>

        {result && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <p className="font-semibold text-emerald-200">✅ {result.imported} groups imported</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-red-200">
                {result.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 20 && <li>…and {result.errors.length - 20} more</li>}
              </ul>
            )}
            <a href="/groups" className="mt-3 inline-block text-indigo-300 hover:underline">
              View groups →
            </a>
          </div>
        )}
      </div>
    </Shell>
  );
}
