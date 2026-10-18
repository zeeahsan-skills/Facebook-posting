import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB } from "../../../lib/db";

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const db = await readDB();
  return NextResponse.json({ log: db.activity_log.slice(0, 100) });
}
