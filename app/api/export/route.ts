import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";

// GET /api/export?type=tasks|clicks|groups -> CSV download
export async function GET(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "tasks";

  let csv = "";
  let filename = "";

  if (type === "groups") {
    const { data } = await supabase.from("groups").select("name,url,country,category,created_at");
    csv = "name,url,country,category,created_at\n" +
      (data || []).map((g: any) =>
        [g.name, g.url, g.country || "", g.category || "", g.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ).join("\n");
    filename = "groups.csv";
  } else if (type === "clicks") {
    const { data } = await supabase
      .from("click_events")
      .select("clicked_at,referrer,country,campaigns(name)")
      .order("clicked_at", { ascending: false })
      .limit(5000);
    csv = "clicked_at,campaign,referrer,country\n" +
      (data || []).map((c: any) =>
        [c.clicked_at, (c.campaigns as any)?.name || "", c.referrer || "", c.country || ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ).join("\n");
    filename = "clicks.csv";
  } else {
    const { data } = await supabase
      .from("tasks")
      .select("created_at,scheduled_at,status,post_link,error,attempts,groups(name),campaigns(name)")
      .order("created_at", { ascending: false })
      .limit(5000);
    csv = "created_at,scheduled_at,campaign,group,status,post_link,attempts,error\n" +
      (data || []).map((t: any) =>
        [t.created_at, t.scheduled_at || "", (t.campaigns as any)?.name || "",
         (t.groups as any)?.name || "", t.status, t.post_link || "",
         t.attempts, (t.error || "").replace(/\n/g, " ")]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ).join("\n");
    filename = "tasks.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
