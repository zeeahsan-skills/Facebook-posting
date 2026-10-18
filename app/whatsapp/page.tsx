"use client";
import Shell from "../../components/Shell";
import { card, label, input, btn } from "../../components/ui";
import { useState } from "react";

export default function WhatsAppPage() {
  const [connected] = useState(false);

  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">WhatsApp Control</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Send commands and receive notifications from your phone.
      </p>

      <div className={`${card} max-w-2xl`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-600"}`} />
          <p className="font-semibold">{connected ? "Connected" : "Not connected"}</p>
        </div>

        {!connected && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-semibold">Setup required</p>
            <p className="mt-1 text-amber-200/80">
              WhatsApp Business Platform integration is not configured yet. To enable it you need:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-200/80">
              <li>A Meta developer account and a WhatsApp Business app</li>
              <li>A dedicated phone number for the business account</li>
              <li>The access token and phone number ID added as environment variables</li>
            </ol>
            <p className="mt-2 text-amber-200/80">
              See the README section "WhatsApp Setup" for step-by-step instructions.
              The tool honestly reports <b>not connected</b> until this is done — no fake status.
            </p>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 font-semibold">Supported commands (once connected)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["START", "Begin scheduled posting"],
              ["PAUSE", "Pause new tasks"],
              ["RESUME", "Resume paused tasks"],
              ["STOP", "Stop the agent safely"],
              ["STATUS", "Current progress summary"],
              ["REPORT", "Detailed posting report"],
              ["TODAY", "Groups processed today"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                <code className="text-sm font-bold text-indigo-300">{cmd}</code>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Only messages from your verified number will be accepted as commands.
          </p>
        </div>
      </div>
    </Shell>
  );
}
