import { NextResponse } from "next/server";
import { needAuth } from "../../../../lib/api-auth";
import { readDB, writeDB } from "../../../../lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const db = await readDB();
  const g = db.groups.find((x) => x.id === params.id);
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
  for (const k of ["name", "url", "country", "category"] as const) {
    if (body[k] !== undefined) (g as any)[k] = body[k]?.trim() || null;
  }
  await writeDB(db);
  return NextResponse.json({ group: g });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  db.groups = db.groups.filter((x) => x.id !== params.id);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
