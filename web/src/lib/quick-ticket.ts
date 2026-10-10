import { plain } from "./board";
import type { FieldValues, NewTicket } from "./types";
import { workspace } from "./workspace";

// A ticket made from just a title (board columns, calendar days): type and
// starting status come from Settings → Workflow, never from fixed names.
export function quickTicket(title: string, fields: FieldValues = {}): NewTicket {
  const w = workspace();
  const type = w.quickType ?? undefined;
  const word = plain(type).toLowerCase();
  return {
    title: word ? `[${plain(type)}] ${title.trim()}` : title.trim(),
    body: "", labels: word ? [word] : [], assignees: [],
    fields: { Status: w.start ?? undefined, "Ticket Type": type, ...fields },
  };
}
