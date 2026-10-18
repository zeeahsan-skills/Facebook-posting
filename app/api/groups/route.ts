import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, uid, nowISO, Group } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  const groups = [...db.groups].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const { name, url, country, category } = body;
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }
  if (!/^https?:\/\/(www\.)?facebook\.com\/groups\//.test(url.trim())) {
    return NextResponse.json({ error: "URL must be a Facebook group URL" }, { status: 400 });
  }
  const db = await readDB();
  const group: Group = {
    id: uid(),
    name: name.trim(),
    url: url.trim(),
    country: country?.trim() || null,
    category: category?.trim() || null,
    created_at: nowISO(),
  };
  db.groups.push(group);
  await writeDB(db);
  return NextResponse.json({ group });
}
