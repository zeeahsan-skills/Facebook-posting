import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";

// POST CSV text -> creates groups. Expected header: name,url,country,category
export async function POST(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const csv = (body.csv || "") as string;
  if (!csv.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.indexOf("name");
  const urlIdx = header.indexOf("url");
  if (nameIdx === -1 || urlIdx === -1) {
    return NextResponse.json(
      { error: "CSV needs at least 'name' and 'url' columns" },
      { status: 400 }
    );
  }
  const countryIdx = header.indexOf("country");
  const categoryIdx = header.indexOf("category");

  const rows: any[] = [];
  const errors: string[] = [];
  const urlRe = /^https?:\/\/(www\.)?facebook\.com\/groups\//;

  lines.slice(1).forEach((line, i) => {
    // simple CSV split (no quoted commas) — good enough for URLs/names
    const cols = line.split(",").map((c) => c.trim());
    const name = cols[nameIdx] || "";
    const url = cols[urlIdx] || "";
    if (!name || !url) {
      errors.push(`Row ${i + 2}: missing name or url`);
      return;
    }
    if (!urlRe.test(url)) {
      errors.push(`Row ${i + 2}: not a Facebook group URL`);
      return;
    }
    rows.push({
      user_id: user.id,
      name,
      url,
      country: countryIdx >= 0 ? cols[countryIdx] || null : null,
      category: categoryIdx >= 0 ? cols[categoryIdx] || null : null,
    });
  });

  let inserted = 0;
  if (rows.length > 0) {
    const { error, count } = await supabase
      .from("groups")
      .insert(rows, { count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = count ?? rows.length;
  }

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event: "GROUPS_IMPORTED",
    detail: `${inserted} imported, ${errors.length} skipped`,
  });

  return NextResponse.json({ imported: inserted, errors });
}
