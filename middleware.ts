import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE } from "./lib/auth";

const PUBLIC = ["/login", "/setup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/api/track") ||
    PUBLIC.some((p) => path === p || path.startsWith(p + "/")) ||
    path === "/"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!(await verifyToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
