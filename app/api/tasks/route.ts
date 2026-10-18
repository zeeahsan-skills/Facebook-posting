import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, uid, nowISO, Task } from "../../../lib/db";

function simpleHash(s: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function withNames(db: Awaited<ReturnType<typeof readDB>>, tasks: Task[]) {
  return tasks.map((t) => ({
    ...t,
    groups: db.groups.find((g) => g.id === t.group_id)
      ? { name: db.groups.find((g) => g.id === t.group_id)!.name } : null,
    campaigns: db.campaigns.find((c) => c.id === t.campaign_id)
      ? { name: db.campaigns.find((c) => c.id === t.campaign_id)!.name,
          tracking_code: db.campaigns.find((c) => c.id === t.campaign_id)!.tracking_code } : null,
  }));
}

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const campaign_id = searchParams.get("campaign_id");

  const db = await readDB();
  let tasks = [...db.tasks].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (campaign_id) tasks = tasks.filter((t) => t.campaign_id === campaign_id);
  return NextResponse.json({ tasks: withNames(db, tasks.slice(0, 200)) });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const { campaign_id, group_ids, scheduled_at, timezone } = body;

  if (!campaign_id || !Array.isArray(group_ids) || group_ids.length === 0) {
    return NextResponse.json(
      { error: "campaign_id and group_ids[] are required" },
      { status: 400 }
    );
  }

  const db = await readDB();
  const campaign = db.campaigns.find((c) => c.id === campaign_id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaign.enabled) {
    return NextResponse.json({ error: "Campaign is disabled" }, { status: 400 });
  }

  const existingKeys = new Set(db.tasks.map((t) => t.idempotency_key));
  let added = 0;
  for (const gid of group_ids) {
    const key = simpleHash(`${campaign_id}|${gid}|${scheduled_at || "asap"}`);
    if (existingKeys.has(key)) continue; // idempotent — never duplicate
    existingKeys.add(key);
    const task: Task = {
      id: uid(),
      group_id: gid,
      campaign_id,
      scheduled_at: scheduled_at || null,
      timezone: timezone || "Asia/Karachi",
      status: "queued",
      post_link: null,
      error: null,
      attempts: 0,
      idempotency_key: key,
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    db.tasks.push(task);
    added++;
  }

  await logEvent(db, "TASKS_SCHEDULED", `${added} task(s) scheduled for campaign "${campaign.name}"`);
  await writeDB(db);
  return NextResponse.json({ scheduled: added });
}
