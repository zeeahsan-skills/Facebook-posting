"use client";
import Shell from "../../components/Shell";
import { card } from "../../components/ui";

export default function SettingsPage() {
  return (
    <Shell>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className={`${card} max-w-2xl space-y-6`}>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Data Storage</p>
          <p className="mt-1 text-sm text-zinc-400">
            Your data is stored in your private Vercel Blob store, accessible only with your
            project's token. Export or delete your data anytime from the Dashboard and History pages.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Posting Limits</p>
          <p className="mt-1 text-sm text-zinc-400">
            The worker posts <b className="text-zinc-200">1 task per run</b> with automatic spacing
            to respect Facebook's automation detection. This limit is enforced in the worker and
            cannot be changed from the dashboard (safety by design).
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Retries</p>
          <p className="mt-1 text-sm text-zinc-400">
            Temporary failures (network, page glitches) retry automatically up to <b className="text-zinc-200">3 attempts</b>.
            Permanent failures (blocked, removed group) are marked failed immediately.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Facebook Integration</p>
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            No official Meta API exists for posting to Facebook Groups. The worker uses an authorized
            browser session on your own machine. Never share your Facebook credentials — the tool never asks for them.
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Change Password</p>
          <p className="mt-1 text-sm text-zinc-400">
            The dashboard password is set via the <code className="text-zinc-200">APP_PASSWORD</code>{" "}
            environment variable in Vercel → Settings → Environment Variables.
          </p>
        </div>
      </div>
    </Shell>
  );
}
