import { NextResponse } from "next/server";
import { checkPassword, makeToken, AUTH_COOKIE, verifyToken } from "../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { password, action } = body;

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: "APP_PASSWORD is not set on the server." },
      { status: 503 }
    );
  }
  if (!checkPassword(password || "")) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await makeToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function GET(request: Request) {
  const cookie = (request as any).headers?.get?.("cookie") || "";
  const m = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  return NextResponse.json({ authenticated: verifyToken(m?.[1]) });
}
