import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../../lib/api-auth";

// Retry a failed task (back to queued) or update status
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.action === "retry") {
    updates.status = "queued";
    updates.error = null;
    updates.attempts = 0;
  } else if (body.status) {
    const allowed = ["queued", "skipped", "needs_review"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Status change not allowed" }, { status: 400 });
    }
    updates.status = body.status;
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    task_id: params.id,
    event: body.action === "retry" ? "TASK_RETRIED" : "TASK_UPDATED",
    detail: JSON.stringify(updates),
  });

  return NextResponse.json({ task: data });
}
