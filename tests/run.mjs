// Automated tests for the FB Posting Tool backend logic.
// Run: node tests/run.mjs  (no server needed — tests pure logic)
// These mirror the validation rules used by the API routes.

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// ---- Replicated validation logic (must match app/api/* routes) ----

const GROUP_URL_RE = /^https?:\/\/(www\.)?facebook\.com\/groups\//;
function validGroupUrl(url) { return GROUP_URL_RE.test((url || "").trim()); }

function validCampaign(name, caption, destination_url) {
  if (!name?.trim() || !caption?.trim() || !destination_url?.trim())
    return "Name, caption and destination URL are required";
  try { new URL(destination_url.trim()); }
  catch { return "Destination URL is not valid"; }
  return null;
}

const VALID_STATUSES = ["scheduled","queued","processing","submitted","published",
  "pending_approval","manual_action","failed","skipped","cancelled","needs_review"];
function normalizeStatus(s) {
  if (s === "posted") return "published"; // legacy
  return VALID_STATUSES.includes(s) ? s : "needs_review";
}

function simpleHash(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8,"0") + (h1 >>> 0).toString(16).padStart(8,"0");
}
function idempotencyKey(campaign_id, group_id, scheduled_at) {
  return simpleHash(`${campaign_id}|${group_id}|${scheduled_at || "asap"}`);
}

function parseImportCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const nameIdx = header.indexOf("name"), urlIdx = header.indexOf("url");
  if (nameIdx === -1 || urlIdx === -1) return { error: "CSV needs 'name' and 'url' columns" };
  const ok = [], errors = [];
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(",").map(c => c.trim());
    const name = cols[nameIdx] || "", url = cols[urlIdx] || "";
    if (!name || !url) { errors.push(`Row ${i+2}: missing`); return; }
    if (!validGroupUrl(url)) { errors.push(`Row ${i+2}: bad URL`); return; }
    ok.push({ name, url });
  });
  return { ok, errors };
}

// ---- Tests ----

console.log("\nGroup URL validation");
test("accepts facebook group URL", () =>
  assert(validGroupUrl("https://www.facebook.com/groups/123456")));
test("accepts without www", () =>
  assert(validGroupUrl("https://facebook.com/groups/abc")));
test("rejects non-group URL", () =>
  assert(!validGroupUrl("https://www.facebook.com/somepage")));
test("rejects empty", () => assert(!validGroupUrl("")));
test("rejects non-facebook", () =>
  assert(!validGroupUrl("https://example.com/groups/123")));

console.log("\nCampaign validation");
test("accepts valid campaign", () =>
  assert(validCampaign("C", "Caption", "https://example.com") === null));
test("rejects missing name", () =>
  assert(validCampaign("", "Cap", "https://example.com") !== null));
test("rejects missing caption", () =>
  assert(validCampaign("C", "", "https://example.com") !== null));
test("rejects bad URL", () =>
  assert(validCampaign("C", "Cap", "not-a-url") !== null));

console.log("\nTask lifecycle");
test("legacy 'posted' normalizes to 'published'", () =>
  assert(normalizeStatus("posted") === "published"));
test("all 11 statuses valid", () =>
  assert(VALID_STATUSES.every(s => normalizeStatus(s) === s)));
test("unknown status becomes needs_review", () =>
  assert(normalizeStatus("bogus") === "needs_review"));

console.log("\nIdempotency (duplicate prevention)");
test("same inputs → same key", () =>
  assert(idempotencyKey("c1","g1","2026-01-01") === idempotencyKey("c1","g1","2026-01-01")));
test("different group → different key", () =>
  assert(idempotencyKey("c1","g1") !== idempotencyKey("c1","g2")));
test("different schedule → different key", () =>
  assert(idempotencyKey("c1","g1","2026-01-01") !== idempotencyKey("c1","g1","2026-01-02")));
test("key is deterministic hex", () =>
  assert(/^[0-9a-f]{16}$/.test(idempotencyKey("c","g"))));

console.log("\nCSV import validation");
test("imports valid rows", () => {
  const r = parseImportCsv("name,url\nG1,https://www.facebook.com/groups/1\nG2,https://facebook.com/groups/2");
  assert(r.ok.length === 2 && r.errors.length === 0, JSON.stringify(r));
});
test("skips bad URLs, keeps good", () => {
  const r = parseImportCsv("name,url\nG1,https://www.facebook.com/groups/1\nBad,https://example.com/x");
  assert(r.ok.length === 1 && r.errors.length === 1, JSON.stringify(r));
});
test("rejects missing columns", () => {
  const r = parseImportCsv("title,link\nA,B");
  assert(r.error !== undefined);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
