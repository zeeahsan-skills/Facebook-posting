import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../lib/api-auth";
import { randomBytes } from "crypto";

export async function GET() {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: Request) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const { name, caption, destination_url, enabled } = body;
  if (!name?.trim() || !caption?.trim() || !destination_url?.trim()) {
    return NextResponse.json(
      { error: "Name, caption and destination URL are required" },
      { status: 400 }
    );
  }
  try {
    new URL(destination_url.trim());
  } catch {
    return NextResponse.json({ error: "Destination URL is not valid" }, { status: 400 });
  }
  const tracking_code = randomBytes(4).toString("hex");
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name: name.trim(),
      caption: caption.trim(),
      destination_url: destination_url.trim(),
      tracking_code,
      enabled: enabled !== false,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
