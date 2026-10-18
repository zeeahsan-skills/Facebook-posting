import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, uid, nowISO, Campaign } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  const campaigns = [...db.campaigns].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const { name, caption, destination_url, enabled } = body;
  if (!name?.trim() || !caption?.trim() || !destination_url?.trim()) {
    return NextResponse.json(
      { error: "Name, caption and destination URL are required" },
      { status: 400 }
    );
  }
  try {
    new URL(destination_url.trim());
  } catch {
    return NextResponse.json({ error: "Destination URL is not valid" }, { status: 400 });
  }
  const db = await readDB();
  const campaign: Campaign = {
    id: uid(),
    name: name.trim(),
    caption: caption.trim(),
    destination_url: destination_url.trim(),
    tracking_code: uid().replace(/-/g, "").slice(0, 8),
    enabled: enabled !== false,
    created_at: nowISO(),
  };
  db.campaigns.push(campaign);
  await writeDB(db);
  return NextResponse.json({ campaign });
}
