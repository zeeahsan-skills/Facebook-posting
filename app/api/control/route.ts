import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, nowISO } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  return NextResponse.json({ paused: db.worker_control.paused });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const paused = body.paused === true;
  const db = await readDB();
  db.worker_control = { paused, updated_at: nowISO() };
  await logEvent(db, paused ? "WORKER_PAUSED" : "WORKER_RESUMED",
    paused ? "Posting paused by user" : "Posting resumed by user");
  await writeDB(db);
  return NextResponse.json({ paused });
}
