import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";

export async function GET() {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: data });
}

export async function POST(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const { name, url, country, category } = body;
  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }
  if (!/^https?:\/\/(www\.)?facebook\.com\/groups\//.test(url.trim())) {
    return NextResponse.json({ error: "URL must be a Facebook group URL" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("groups")
    .insert({
      user_id: user.id,
      name: name.trim(),
      url: url.trim(),
      country: country?.trim() || null,
      category: category?.trim() || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}
