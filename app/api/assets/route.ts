import { NextResponse } from "next/server";
import { needAuth } from "../../../lib/api-auth";
import { readDB, writeDB, logEvent, uid, nowISO, Asset } from "../../../lib/db";
import { put } from "@vercel/blob";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB per image

export async function GET(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const { searchParams } = new URL(request.url);
  const campaign_id = searchParams.get("campaign_id");
  const db = await readDB();
  let assets = [...db.assets].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  if (campaign_id) assets = assets.filter((a) => a.campaign_id === campaign_id);
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const campaign_id = (form.get("campaign_id") as string) || null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 4MB" }, { status: 400 });
  }

  const blob = await put(`fb-posting-data/assets/${uid()}-${file.name}`, file, {
    access: "public",
    contentType: file.type,
  });

  const db = await readDB();
  const asset: Asset = {
    id: uid(),
    campaign_id,
    filename: file.name,
    url: blob.url,
    size: file.size,
    uploaded_at: nowISO(),
  };
  db.assets.push(asset);
  await logEvent(db, "ASSET_UPLOADED", `Image "${file.name}" uploaded`);
  await writeDB(db);
  return NextResponse.json({ asset });
}

export async function DELETE(request: Request) {
  const deny = await needAuth(request);
  if (deny) return deny;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await readDB();
  db.assets = db.assets.filter((a) => a.id !== id);
  await logEvent(db, "ASSET_REMOVED", "Image removed from library");
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
