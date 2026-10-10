export type Person = { login: string; avatarUrl: string; name?: string | null };
export type Label = { name: string; color: string; description?: string | null };

export type Option = { id: string; name: string; color?: string; description?: string };
export type Iteration = { id: string; title: string; startDate: string; duration: number };

export type Field =
  | { id: string; name: string; kind: "single"; options: Option[] }
  | { id: string; name: string; kind: "iteration"; iterations: Iteration[] }
  | { id: string; name: string; kind: "date" | "number" | "text" };

// The board fields the app understands. Names match project #34; any other
// custom fields are shown read-only in the ticket drawer.
export type FieldValues = {
  Status?: string;
  Priority?: string;
  "Ticket Type"?: string;
  Component?: string;
  Size?: string;
  "Story Points"?: number;
  "Start date"?: string;
  "Target date"?: string;
  Sprint?: string; // iteration id
};

export type Ticket = {
  itemId: string;
  issueId: string;
  number: number;
  title: string;
  body: string;
  url: string;
  repo: string; // "owner/name": a board can hold issues from several repositories
  state: "OPEN" | "CLOSED";
  stateReason?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  author?: Person | null;
  assignees: Person[];
  labels: Label[];
  commentCount: number;
  parent?: number | null;
  parentUrl?: string | null;
  subIssues: { total: number; completed: number };
  fields: FieldValues;
};

export type Comment = { id: string; restId?: number; author: Person | null; body: string; createdAt: string; editedAt?: string };

export type Board = {
  projectId: string;
  projectTitle: string;
  repoId: string;
  fields: Field[];
  labels: Label[];
  people: Person[];
  viewer: Person;
  tickets: Ticket[];
};

export type FieldName = keyof FieldValues;
export type FieldValue = FieldValues[FieldName] | null;

export type NewTicket = {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
  fields: FieldValues;
  parent?: number | null;
};

// Every way the app reads or writes data. Implemented by the GitHub API and by
// the in-memory demo, so every screen can be used and tested without signing in.
export interface DataSource {
  readonly mode: "github" | "demo";
  load(): Promise<Board>;
  setField(board: Board, t: Ticket, field: FieldName, value: FieldValue): Promise<void>;
  setAssignees(board: Board, t: Ticket, logins: string[]): Promise<void>;
  setLabels(board: Board, t: Ticket, labels: string[]): Promise<void>;
  setState(t: Ticket, state: "OPEN" | "CLOSED", reason?: "COMPLETED" | "NOT_PLANNED"): Promise<void>;
  updateText(t: Ticket, patch: { title?: string; body?: string }): Promise<void>;
  comments(t: Ticket): Promise<Comment[]>;
  addComment(t: Ticket, body: string): Promise<Comment>;
  updateComment(t: Ticket, c: Comment, body: string): Promise<void>;
  deleteComment(t: Ticket, c: Comment): Promise<void>;
  create(board: Board, input: NewTicket): Promise<number>;
  // Relationships: Jira's "blocks / is blocked by", plus the parent link.
  // Related tickets are identified by URL, which is unique across repositories.
  dependencies(t: Ticket): Promise<{ blockedBy: string[]; blocking: string[] }>;
  addBlocker(t: Ticket, blocker: Ticket): Promise<void>;
  removeBlocker(t: Ticket, blocker: Ticket): Promise<void>;
  setParent(t: Ticket, parent: Ticket | null, current: Ticket | null): Promise<void>;
  // Files are stored in the repository under .attachments/<ticket>/ and linked in a comment.
  attach(t: Ticket, file: File): Promise<Attachment>;
  logTime(board: Board, t: Ticket, minutes: number, note: string): Promise<void>;
  // Tags of the configured repository (GitHub labels).
  createLabel(label: Label): Promise<void>;
  updateLabel(name: string, patch: Partial<Label>): Promise<void>;
  deleteLabel(name: string): Promise<void>;
}

export type Attachment = { name: string; url: string; isImage: boolean };
