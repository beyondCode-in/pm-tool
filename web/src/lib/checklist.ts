// Checklists live in the issue body as a GitHub task list under a
// "### Checklist" heading, so they show (and tick) on GitHub too:
//
//   ### Checklist
//   - [x] Write the copy
//   - [ ] Review with design
//
// The rest of the body is the description. split/join keep the two apart.

export type CheckItem = { done: boolean; text: string };

const HEADING = /^#{1,6}\s*checklist\s*$/i;
const ITEM = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/;

export function splitChecklist(body: string): { text: string; items: CheckItem[] } {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((l) => HEADING.test(l.trim()));
  if (start < 0) return { text: body, items: [] };
  let end = start + 1;
  const items: CheckItem[] = [];
  for (; end < lines.length; end++) {
    const m = ITEM.exec(lines[end]);
    if (m) { items.push({ done: m[1] !== " ", text: m[2].trim() }); continue; }
    if (lines[end].trim() === "" && ITEM.test(lines[end + 1] ?? "")) continue;
    if (lines[end].trim() === "" && items.length === 0) continue;
    break;
  }
  const text = [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text, items };
}

export function joinChecklist(text: string, items: CheckItem[]): string {
  const desc = text.trim();
  if (!items.length) return desc;
  const block = ["### Checklist", ...items.map((i) => `- [${i.done ? "x" : " "}] ${i.text.replace(/\n/g, " ").trim()}`)].join("\n");
  return desc ? `${desc}\n\n${block}` : block;
}
