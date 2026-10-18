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
  } else if (body.status && ["queued", "skipped", "needs_review"].includes(body.status)) {
    t.status = body.status;
    t.updated_at = nowISO();
    await logEvent(db, "TASK_UPDATED", `Status -> ${body.status}`, t.id);
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await writeDB(db);
  return NextResponse.json({ task: t });
}
