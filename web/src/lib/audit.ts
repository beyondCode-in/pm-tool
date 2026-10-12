// The audit trail for board fields. GitHub's issue timeline records tags,
// assignees, renames and closes, but not changes to project fields (Priority,
// Sprint, dates, points…). So when the app changes one, it also leaves a short
// note on the issue:
//
//   <!-- beyondpm:audit -->
//   ↪ Changed **Priority** from 🟠 High to 🔴 Critical
//
// The note is signed by whoever made the change and timestamped by GitHub, so
// the history is permanent and readable on GitHub too. The app shows these
// notes in History, not as conversation.

export const AUDIT_MARK = "<!-- beyondpm:audit -->";

export const isAudit = (body: string) => body.startsWith(AUDIT_MARK);

export function auditBody(field: string, from: string | null, to: string | null): string {
  const v = (s: string | null) => (s === null || s === "" ? "_empty_" : `**${s.replace(/\*/g, "")}**`);
  const what = from === null || from === "" ? `Set **${field}** to ${v(to)}` : to === null || to === "" ? `Cleared **${field}** (was ${v(from)})` : `Changed **${field}** from ${v(from)} to ${v(to)}`;
  return `${AUDIT_MARK}\n↪ ${what}`;
}

/** Read a note back: which field, and its old and new values. */
export function parseAudit(body: string): { field: string; from?: string; to?: string } | null {
  if (!isAudit(body)) return null;
  const text = body.slice(AUDIT_MARK.length).trim().replace(/^↪\s*/, "");
  const val = (s: string) => (s === "_empty_" ? undefined : s.replace(/^\*\*|\*\*$/g, ""));
  let m = /^Changed \*\*(.+?)\*\* from (.+) to (.+)$/.exec(text);
  if (m) return { field: m[1], from: val(m[2]), to: val(m[3]) };
  m = /^Set \*\*(.+?)\*\* to (.+)$/.exec(text);
  if (m) return { field: m[1], to: val(m[2]) };
  m = /^Cleared \*\*(.+?)\*\* \(was (.+)\)$/.exec(text);
  if (m) return { field: m[1], from: val(m[2]) };
  return null;
}
