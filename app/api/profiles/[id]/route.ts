import { NextResponse } from "next/server";
import { needAuth } from "../../../../lib/api-auth";
import { readDB, writeDB, logEvent, nowISO } from "../../../../lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const db = await readDB();
  const p = db.profiles.find((x) => x.id === params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const k of ["label", "fb_name", "notes", "enabled", "health", "last_error"] as const) {
    if (body[k] !== undefined) {
      (p as any)[k] = typeof body[k] === "string" ? body[k].trim() || null : body[k];
    }
  }
  if (body.mark_activity === true) p.last_activity = nowISO();
  await logEvent(db, "PROFILE_UPDATED", `Profile "${p.label}" updated`);
  await writeDB(db);
  return NextResponse.json({ profile: p });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  const p = db.profiles.find((x) => x.id === params.id);
  db.profiles = db.profiles.filter((x) => x.id !== params.id);
  if (p) await logEvent(db, "PROFILE_REMOVED", `Profile "${p.label}" removed`);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
