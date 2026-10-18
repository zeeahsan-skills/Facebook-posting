import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, uid, nowISO } from "../../../lib/db";

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
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

  const urlRe = /^https?:\/\/(www\.)?facebook\.com\/groups\//;
  const errors: string[] = [];
  const db = await readDB();
  let imported = 0;

  lines.slice(1).forEach((line, i) => {
    const cols = line.split(",").map((c) => c.trim());
    const name = cols[nameIdx] || "";
    const url = cols[urlIdx] || "";
    if (!name || !url) { errors.push(`Row ${i + 2}: missing name or url`); return; }
    if (!urlRe.test(url)) { errors.push(`Row ${i + 2}: not a Facebook group URL`); return; }
    db.groups.push({
      id: uid(),
      name,
      url,
      country: countryIdx >= 0 ? cols[countryIdx] || null : null,
      category: categoryIdx >= 0 ? cols[categoryIdx] || null : null,
      created_at: nowISO(),
    });
    imported++;
  });

  await logEvent(db, "GROUPS_IMPORTED", `${imported} imported, ${errors.length} skipped`);
  await writeDB(db);
  return NextResponse.json({ imported, errors });
}
