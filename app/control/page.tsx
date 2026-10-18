"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { input, btn, btnGhost, card, label } from "../../components/ui";

export default function ControlPage() {
  const [paused, setPaused] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [savedInstructions, setSavedInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/control");
    const data = await res.json();
    setPaused(data.paused ?? false);
    setInstructions(data.agent_instructions || "");
    setSavedInstructions(data.agent_instructions || "");
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setPause(value: boolean) {
    setToggling(true);
    const res = await fetch("/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: value }),
    });
    const data = await res.json();
    setPaused(data.paused);
    setToggling(false);
  }

  async function saveInstructions() {
    setSaving(true);
    await fetch("/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_instructions: instructions }),
    });
    setSavedInstructions(instructions);
    setSaving(false);
  }

  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">AI Agent Control</h1>
      <p className="mb-6 text-sm text-zinc-400">
        The background worker processes your queued tasks automatically. Pause stops new tasks from starting.
      </p>

      <div className={`${card} max-w-xl`}>
        <div className="flex items-center gap-4">
          <span className={`relative flex h-4 w-4`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${paused ? "bg-red-500" : "bg-emerald-500"}`} />
            <span className={`relative inline-flex h-4 w-4 rounded-full ${paused ? "bg-red-500" : "bg-emerald-500"}`} />
          </span>
          <div>
            <p className="font-semibold">{loading ? "Checking…" : paused ? "Agent Paused" : "Agent Running"}</p>
            <p className="text-sm text-zinc-400">
              {paused
                ? "No new tasks will start. In-progress tasks finish safely."
                : "Processing queued tasks on schedule."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {paused ? (
            <button onClick={() => setPause(false)} disabled={toggling || loading} className={btn}>
              ▶ Resume Agent
            </button>
          ) : (
            <button onClick={() => setPause(true)} disabled={toggling || loading} className={btnGhost}>
              ⏸ Pause Agent
            </button>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
          <p className="font-semibold text-zinc-200">How it works</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Worker picks up <b>queued</b> tasks whose scheduled time has arrived.</li>
            <li>Each task is validated (group URL, caption, link) before posting.</li>
            <li>Temporary failures retry automatically (max 3 attempts).</li>
            <li>Duplicates are blocked by idempotency keys.</li>
            <li>Every decision is written to the activity log.</li>
          </ul>
        </div>
      </div>

      <div className={`${card} mt-6 max-w-3xl`}>
        <h2 className="mb-1 text-sm font-semibold text-zinc-200">🧠 Agent Instructions</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Write plain-language rules for the agent (e.g. "Prioritize UK job groups on weekdays",
          "Never post the same caption twice in one day"). The agent reads these before
          selecting tasks. Deterministic safety rules always apply on top.
        </p>
        <textarea
          className={`${input} min-h-[120px] font-mono text-xs`}
          placeholder="e.g. Post job campaigns to UK groups first. Skip dating groups on Fridays. …"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveInstructions} disabled={saving || instructions === savedInstructions} className={btn}>
            {saving ? "Saving…" : "Save instructions"}
          </button>
          {instructions !== savedInstructions && (
            <span className="text-xs text-amber-300">Unsaved changes</span>
          )}
        </div>
      </div>
    </Shell>
  );
}
