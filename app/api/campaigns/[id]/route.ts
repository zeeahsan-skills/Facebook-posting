import { NextResponse } from "next/server";
import { requireUser, unauthorized, notConfigured, server } from "../../../../lib/api-auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const body = await request.json();
  const updates: Record<string, any> = {};
  for (const k of ["name", "caption", "destination_url", "enabled"]) {
    if (body[k] !== undefined) {
      updates[k] = typeof body[k] === "string" ? body[k].trim() || null : body[k];
    }
  }
  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!server()) return notConfigured();
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { error } = await supabase.from("campaigns").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
