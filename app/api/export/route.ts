import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB } from "../../../lib/db";

function csvCell(v: any) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "tasks";
  const db = await readDB();

  let csv = "";
  let filename = "";

  if (type === "groups") {
    csv = "name,url,country,category,created_at\n" +
      db.groups.map((g) => [g.name, g.url, g.country, g.category, g.created_at].map(csvCell).join(",")).join("\n");
    filename = "groups.csv";
  } else if (type === "clicks") {
    csv = "clicked_at,campaign,referrer,country\n" +
      db.click_events.map((c) => {
        const camp = db.campaigns.find((x) => x.id === c.campaign_id);
        return [c.clicked_at, camp?.name || "", c.referrer, c.country].map(csvCell).join(",");
      }).join("\n");
    filename = "clicks.csv";
  } else {
    csv = "created_at,scheduled_at,campaign,group,status,post_link,attempts,error\n" +
      db.tasks.map((t) => {
        const camp = db.campaigns.find((x) => x.id === t.campaign_id);
        const grp = db.groups.find((x) => x.id === t.group_id);
        return [t.created_at, t.scheduled_at, camp?.name, grp?.name, t.status,
          t.post_link, t.attempts, (t.error || "").replace(/\n/g, " ")].map(csvCell).join(",");
      }).join("\n");
    filename = "tasks.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
