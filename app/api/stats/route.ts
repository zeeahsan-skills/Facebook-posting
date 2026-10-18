import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();

  const tasksByStatus: Record<string, number> = {};
  db.tasks.forEach((t) => {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  });

  const clicksPerDay: Record<string, number> = {};
  db.click_events.forEach((c) => {
    const day = c.clicked_at.slice(0, 10);
    clicksPerDay[day] = (clicksPerDay[day] || 0) + 1;
  });

  const perCampaign = new Map<string, { name: string; clicks: number }>();
  db.click_events.forEach((c) => {
    const camp = db.campaigns.find((x) => x.id === c.campaign_id);
    const name = camp?.name || c.campaign_id.slice(0, 8);
    const entry = perCampaign.get(c.campaign_id) || { name, clicks: 0 };
    entry.clicks++;
    perCampaign.set(c.campaign_id, entry);
  });

  return NextResponse.json({
    groups: db.groups.length,
    campaigns: db.campaigns.length,
    tasksByStatus,
    totalClicks: db.click_events.length,
    clicksPerDay,
    clicksPerCampaign: [...perCampaign.values()].sort((a, b) => b.clicks - a.clicks),
  });
}
