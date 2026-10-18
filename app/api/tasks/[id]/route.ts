import { NextResponse } from "next/server";
import { needAuth } from "../../../../lib/api-auth";
import { readDB, writeDB, logEvent, nowISO } from "../../../../lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const db = await readDB();
  const t = db.tasks.find((x) => x.id === params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "retry") {
    t.status = "queued";
    t.error = null;
    t.attempts = 0;
    t.updated_at = nowISO();
    await logEvent(db, "TASK_RETRIED", `Task requeued`, t.id);
  } else if (body.action === "cancel") {
    t.status = "cancelled";
    t.updated_at = nowISO();
    await logEvent(db, "TASK_CANCELLED", `Task cancelled by user`, t.id);
  } else if (body.status && [
    "scheduled", "queued", "processing", "submitted", "published",
    "pending_approval", "manual_action", "failed", "skipped",
    "cancelled", "needs_review",
  ].includes(body.status)) {
    t.status = body.status;
    if (body.post_link !== undefined) t.post_link = body.post_link || null;
    if (body.error !== undefined) t.error = body.error || null;
    t.updated_at = nowISO();
    await logEvent(db, "TASK_UPDATED", `Status -> ${body.status}`, t.id);
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await writeDB(db);
  return NextResponse.json({ task: t });
}
