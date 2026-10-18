import { NextResponse } from "next/server";
import { readDB, writeDB, uid, nowISO } from "../../../../lib/db";

// Public click tracker: /api/track/[code] -> log click -> 302 to destination
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  let db;
  try {
    db = await readDB();
  } catch {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const campaign = db.campaigns.find((c) => c.tracking_code === params.code);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown tracking link" }, { status: 404 });
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    db.click_events.push({
      id: uid(),
      campaign_id: campaign.id,
      task_id: null,
      clicked_at: nowISO(),
      referrer: request.headers.get("referer"),
      country: null,
      ip_hash: uid().slice(0, 16),
    });
    await writeDB(db);
  } catch {
    /* logging must never break the redirect */
  }

  return NextResponse.redirect(campaign.destination_url, 302);
}
