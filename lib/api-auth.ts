import { NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "./auth";

export async function isAuthed(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return verifyToken(m?.[1]);
}

export async function needAuth(request: Request) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return null;
}
