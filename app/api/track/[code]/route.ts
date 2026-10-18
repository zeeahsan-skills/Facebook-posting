import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// Public click tracker: /api/track/[code] -> log click -> 302 to destination
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = createClient(url, serviceKey);

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, destination_url")
    .eq("tracking_code", params.code)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Unknown tracking link" }, { status: 404 });
  }

  // Best-effort click log (never block the redirect)
  try {
    const req = request as any;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await supabase.from("click_events").insert({
      campaign_id: campaign.id,
      referrer: req.headers.get("referer") || null,
      country: null, // enriched later if GeoIP is added
      ip_hash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
    });
  } catch {
    /* logging must never break the redirect */
  }

  return NextResponse.redirect(campaign.destination_url, 302);
}
