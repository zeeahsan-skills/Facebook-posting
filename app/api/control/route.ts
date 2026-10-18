import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";

// Worker control: pause / resume the background posting worker
export async function GET() {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data } = await supabase
    .from("worker_control")
    .select("paused")
    .eq("user_id", user.id)
    .single();
  return NextResponse.json({ paused: data?.paused ?? false });
}

export async function POST(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const paused = body.paused === true;

  const { error } = await supabase.from("worker_control").upsert(
    { user_id: user.id, paused, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event: paused ? "WORKER_PAUSED" : "WORKER_RESUMED",
    detail: paused ? "Posting paused by user" : "Posting resumed by user",
  });

  return NextResponse.json({ paused });
}
