import { NextResponse } from "next/server";
import { createServerSupabase } from "./supabase-server";

export async function requireUser() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

export function notConfigured() {
  return NextResponse.json(
    { error: "Supabase not configured. Add environment variables first." },
    { status: 503 }
  );
}

export function server() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return true;
}
