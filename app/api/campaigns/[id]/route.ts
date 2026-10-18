import { NextResponse } from "next/server";
import { needAuth } from "../../../../lib/api-auth";
import { readDB, writeDB } from "../../../../lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const db = await readDB();
  const c = db.campaigns.find((x) => x.id === params.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  for (const k of ["name", "caption", "destination_url", "enabled"] as const) {
    if (body[k] !== undefined) {
      (c as any)[k] = typeof body[k] === "string" ? body[k].trim() || null : body[k];
    }
  }
  await writeDB(db);
  return NextResponse.json({ campaign: c });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  db.campaigns = db.campaigns.filter((x) => x.id !== params.id);
  db.tasks = db.tasks.filter((x) => x.campaign_id !== params.id);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
