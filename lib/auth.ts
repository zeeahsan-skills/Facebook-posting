// Edge + Node compatible auth using Web Crypto API.

const COOKIE = "fbtool_auth";

function secret(): string {
  // Available in both middleware (edge) and API routes (node)
  const s =
    (typeof process !== "undefined" && process.env.APP_PASSWORD) || "";
  return s;
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeToken(): Promise<string> {
  return hmacHex("fb-posting-tool-auth");
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !secret()) return false;
  const expected = await makeToken();
  if (token.length !== expected.length) return false;
  // constant-time-ish comparison
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function checkPassword(password: string): boolean {
  const expected = (typeof process !== "undefined" && process.env.APP_PASSWORD) || "";
  if (!expected || !password) return false;
  if (password.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const AUTH_COOKIE = COOKIE;
