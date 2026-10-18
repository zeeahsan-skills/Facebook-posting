import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";
import { createHash } from "crypto";

export async function GET(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const campaign_id = searchParams.get("campaign_id");

  let q = supabase
    .from("tasks")
    .select("*, groups(name,url), campaigns(name,tracking_code)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  if (campaign_id) q = q.eq("campaign_id", campaign_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

// Schedule: create one task per group for a campaign (idempotent)
export async function POST(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const { campaign_id, group_ids, scheduled_at, timezone } = body;

  if (!campaign_id || !Array.isArray(group_ids) || group_ids.length === 0) {
    return NextResponse.json(
      { error: "campaign_id and group_ids[] are required" },
      { status: 400 }
    );
  }

  // Verify campaign belongs to user and is enabled
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id,enabled")
    .eq("id", campaign_id)
    .single();
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaign.enabled) {
    return NextResponse.json({ error: "Campaign is disabled" }, { status: 400 });
  }

  const rows = group_ids.map((gid: string) => {
    const key = createHash("sha256")
      .update(`${campaign_id}|${gid}|${scheduled_at || "asap"}`)
      .digest("hex")
      .slice(0, 24);
    return {
      user_id: user.id,
      group_id: gid,
      campaign_id,
      scheduled_at: scheduled_at || null,
      timezone: timezone || "Asia/Karachi",
      status: "queued",
      idempotency_key: key,
    };
  });

  // upsert on idempotency_key — duplicates are ignored, never double-created
  const { data, error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true })
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event: "TASKS_SCHEDULED",
    detail: `${group_ids.length} group(s) scheduled for campaign ${campaign_id}`,
  });

  return NextResponse.json({ scheduled: data?.length ?? 0 });
}
