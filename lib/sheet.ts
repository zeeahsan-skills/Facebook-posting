export const SHEET_ID = "119f8ePsXm477lXya5ifvrXs-INmxpSmRYJsPMEOlpQg";

export type Task = {
  row: number;
  caption: string;
  groupUrl: string;
  groupName: string;
  date: string;
  time: string;
  status: string;
  postedAt: string;
  postLink: string;
};

export type LogEvent = {
  timestamp: string;
  taskId: string;
  event: string;
  detail: string;
};

function gvizUrl(sheet: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
}

async function fetchSheet(sheet: string): Promise<string[][]> {
  const res = await fetch(gvizUrl(sheet), { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  // gviz returns: google.visualization.Query.setResponse({...});
  const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const cols: string[] = json.table.cols.map((c: any) => (c.label || "").trim());
  const rows: string[][] = (json.table.rows || []).map((r: any) =>
    cols.map((_, i) => {
      const cell = r.c ? r.c[i] : null;
      if (!cell) return "";
      // prefer formatted value (f) for dates, raw value (v) otherwise
      const v = cell.f ?? cell.v ?? "";
      return String(v);
    })
  );
  return [cols, ...rows];
}

export async function getTasks(): Promise<Task[]> {
  const [header, ...rows] = await fetchSheet("Sheet1");
  const idx = (n: string) => header.indexOf(n);
  return rows
    .filter((r) => r.some((c) => c.trim()))
    .map((r, i) => ({
      row: i + 2,
      caption: r[idx("Caption")] || "",
      groupUrl: r[idx("Facebook Group URL")] || "",
      groupName: r[idx("Facebook Group URL")] || "",
      date: r[idx("Date")] || "",
      time: r[idx("Time")] || "",
      status: r[idx("Posting Status")] || "",
      postedAt: r[idx("Posted At")] || "",
      postLink: r[idx("Post Link")] || "",
    }));
}

export async function getLog(): Promise<LogEvent[]> {
  try {
    const [header, ...rows] = await fetchSheet("Log");
    const idx = (n: string) => header.indexOf(n);
    return rows
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => ({
        timestamp: r[idx("Timestamp")] || "",
        taskId: r[idx("Task ID")] || "",
        event: r[idx("Event")] || "",
        detail: r[idx("Detail")] || "",
      }))
      .reverse();
  } catch {
    return [];
  }
}

export function groupNameFromUrl(url: string): string {
  const m = url.match(/groups\/(\d+)/);
  return m ? `Group ${m[1].slice(0, 6)}…` : url.slice(0, 40);
}
