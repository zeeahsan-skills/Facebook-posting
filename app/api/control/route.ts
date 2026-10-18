import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, nowISO } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  return NextResponse.json({
    paused: db.worker_control.paused,
    agent_instructions: db.worker_control.agent_instructions || "",
  });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const body = await request.json();
  const db = await readDB();
  if (body.paused !== undefined) {
    const paused = body.paused === true;
    db.worker_control.paused = paused;
    db.worker_control.updated_at = nowISO();
    await logEvent(db, paused ? "WORKER_PAUSED" : "WORKER_RESUMED",
      paused ? "Posting paused by user" : "Posting resumed by user");
  }
  if (typeof body.agent_instructions === "string") {
    db.worker_control.agent_instructions = body.agent_instructions.slice(0, 5000);
    await logEvent(db, "AGENT_INSTRUCTIONS_UPDATED", "Agent instructions updated");
  }
  await writeDB(db);
  return NextResponse.json({
    paused: db.worker_control.paused,
    agent_instructions: db.worker_control.agent_instructions || "",
  });
}
