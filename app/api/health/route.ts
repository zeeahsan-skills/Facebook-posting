import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB } from "../../../lib/db";

// Worker health: queue depth, task distribution, recent activity, storage info.
// NOTE: actual Facebook posting runs on the user's local machine (browser session),
// not in the cloud — this endpoint reports the cloud-side queue + DB health.
export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();

  const byStatus: Record<string, number> = {};
  db.tasks.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  const now = new Date();
  const overdue = db.tasks.filter(
    (t) =>
      (t.status === "queued" || t.status === "scheduled") &&
      t.scheduled_at &&
      new Date(t.scheduled_at) < now
  ).length;

  const stuck = db.tasks.filter((t) => t.status === "processing").length;

  const recentErrors = db.activity_log
    .filter((l) => /FAIL|ERROR/i.test(l.event))
    .slice(0, 5)
    .map((l) => ({ event: l.event, detail: l.detail, at: l.created_at }));

  const lastActivity = db.activity_log[0]?.created_at || null;

  return NextResponse.json({
    queue: {
      paused: db.worker_control.paused,
      byStatus,
      overdue,
      stuckProcessing: stuck,
      total: db.tasks.length,
    },
    posting_note:
      "Facebook posting executes on your local machine via your browser session. " +
      "The cloud dashboard manages the queue, schedule, and analytics — it cannot post by itself.",
    recentErrors,
    lastActivity,
    storage: {
      groups: db.groups.length,
      campaigns: db.campaigns.length,
      profiles: db.profiles.length,
      assets: db.assets.length,
      attempts: db.posting_attempts.length,
      logRows: db.activity_log.length,
    },
  });
}
