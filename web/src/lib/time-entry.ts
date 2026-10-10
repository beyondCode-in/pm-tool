// Time entries are issue comments, readable on GitHub as they are:
//   ⏱️ Logged **1h 30m** — wrote the copy
//   ⏱️ Logged **45m** on 2026-10-08 — review   (logged for an earlier day)
// Entries without "on <date>" count on the day the comment was written.

export type TimeEntry = { minutes: number; note: string; date: string | null };

const RE = /^⏱️ Logged \*\*(?:(\d+)h )?(\d+)m\*\*(?: on (\d{4}-\d{2}-\d{2}))?(?: — ([\s\S]*))?/;

export function timeBody(minutes: number, note: string, date?: string | null): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `⏱️ Logged **${h ? `${h}h ` : ""}${m}m**${date ? ` on ${date}` : ""}${note ? ` — ${note}` : ""}`;
}

export function parseTime(body: string): TimeEntry | null {
  const m = RE.exec(body);
  return m ? { minutes: Number(m[1] ?? 0) * 60 + Number(m[2]), date: m[3] ?? null, note: (m[4] ?? "").trim() } : null;
}

/** The local calendar day an entry counts towards. */
export function entryDay(entry: TimeEntry, createdAt: string): string {
  if (entry.date) return entry.date;
  const d = new Date(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "1h 30m", "1h", "90m", "90", "1:30", "1.5h" → minutes. */
export function parseDuration(s: string): number {
  const v = s.trim().toLowerCase();
  if (!v) return 0;
  const colon = /^(\d+):(\d{1,2})$/.exec(v);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const hm = /^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m?)?$/.exec(v);
  if (hm && (hm[1] || hm[2])) return Math.round(Number(hm[1] ?? 0) * 60) + Number(hm[2] ?? 0);
  return 0;
}
