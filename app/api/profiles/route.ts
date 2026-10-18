import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, uid, nowISO, Profile } from "../../../lib/db";

const MAX_PROFILES = 5;

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  return NextResponse.json({ profiles: db.profiles, max: MAX_PROFILES });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  if (db.profiles.length >= MAX_PROFILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PROFILES} profiles allowed` },
      { status: 400 }
    );
  }
  const body = await request.json();
  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }
  const profile: Profile = {
    id: uid(),
    label: body.label.trim(),
    fb_name: body.fb_name?.trim() || null,
    notes: body.notes?.trim() || null,
    enabled: body.enabled !== false,
    health: "unknown",
    last_activity: null,
    last_error: null,
    created_at: nowISO(),
  };
  db.profiles.push(profile);
  await logEvent(db, "PROFILE_ADDED", `Profile "${profile.label}" added`);
  await writeDB(db);
  return NextResponse.json({ profile });
}
