import { put, head } from "@vercel/blob";
import { randomUUID } from "crypto";

// JSON document database on Vercel Blob.
// Single file (data.json) holds all collections. Fine for personal use.

export type Group = {
  id: string; name: string; url: string;
  country: string | null; category: string | null; created_at: string;
};
export type Campaign = {
  id: string; name: string; caption: string; destination_url: string;
  tracking_code: string; enabled: boolean; created_at: string;
};
export type Task = {
  id: string; group_id: string; campaign_id: string;
  scheduled_at: string | null; timezone: string;
  status: "queued" | "processing" | "posted" | "pending_approval" | "failed" | "needs_review" | "skipped";
  post_link: string | null; error: string | null; attempts: number;
  idempotency_key: string; created_at: string; updated_at: string;
};
export type ClickEvent = {
  id: string; campaign_id: string; task_id: string | null;
  clicked_at: string; referrer: string | null; country: string | null; ip_hash: string;
};
export type LogRow = {
  id: string; task_id: string | null; event: string;
  detail: string | null; created_at: string;
};
export type DB = {
  groups: Group[];
  campaigns: Campaign[];
  tasks: Task[];
  click_events: ClickEvent[];
  activity_log: LogRow[];
  worker_control: { paused: boolean; updated_at: string };
};

const KEY = "fb-posting-data/data.json";

function emptyDB(): DB {
  return {
    groups: [],
    campaigns: [],
    tasks: [],
    click_events: [],
    activity_log: [],
    worker_control: { paused: false, updated_at: new Date().toISOString() },
  };
}

export function uid() {
  return randomUUID();
}
export function nowISO() {
  return new Date().toISOString();
}

export async function readDB(): Promise<DB> {
  try {
    await head(KEY);
  } catch {
    return emptyDB(); // first run — no file yet
  }
  // Fetch via the blob URL with cache-buster (Blob CDN can serve stale overwrites)
  const meta = await head(KEY);
  const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return emptyDB();
  const data = await res.json();
  // Merge with empty to tolerate missing collections
  return { ...emptyDB(), ...data };
}

export async function writeDB(db: DB): Promise<void> {
  await put(KEY, JSON.stringify(db), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function logEvent(
  db: DB,
  event: string,
  detail: string | null = null,
  task_id: string | null = null
) {
  db.activity_log.unshift({
    id: uid(),
    task_id,
    event,
    detail,
    created_at: nowISO(),
  });
  // Keep log bounded
  if (db.activity_log.length > 500) {
    db.activity_log = db.activity_log.slice(0, 500);
  }
}
