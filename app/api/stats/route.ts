import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";

// Dashboard overview stats
export async function GET() {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const [groups, campaigns, tasks, clicks] = await Promise.all([
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("status"),
    supabase.from("click_events").select("id,clicked_at,campaign_id", { count: "exact" }),
  ]);

  const byStatus: Record<string, number> = {};
  (tasks.data || []).forEach((t: any) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  // Clicks per day (last 14 days)
  const perDay: Record<string, number> = {};
  (clicks.data || []).forEach((c: any) => {
    const day = c.clicked_at.slice(0, 10);
    perDay[day] = (perDay[day] || 0) + 1;
  });

  // Clicks per campaign
  const { data: campClicks } = await supabase
    .from("click_events")
    .select("campaign_id,campaigns(name)")
    .limit(5000);
  const perCampaign: Record<string, { name: string; clicks: number }> = {};
  (campClicks || []).forEach((c: any) => {
    const name = (c.campaigns as any)?.name || c.campaign_id.slice(0, 8);
    if (!perCampaign[c.campaign_id]) perCampaign[c.campaign_id] = { name, clicks: 0 };
    perCampaign[c.campaign_id].clicks++;
  });

  return NextResponse.json({
    groups: groups.count ?? 0,
    campaigns: campaigns.count ?? 0,
    tasksByStatus: byStatus,
    totalClicks: clicks.count ?? 0,
    clicksPerDay: perDay,
    clicksPerCampaign: Object.values(perCampaign).sort((a, b) => b.clicks - a.clicks),
  });
}
