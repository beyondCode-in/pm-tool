import { config } from "./config";
import type { Board, Comment, DataSource, Field, FieldName, FieldValue, FieldValues, Label, NewTicket, Person, Ticket, HistoryEvent } from "./types";
import { workspace } from "./workspace";

const ATTACH_BRANCH = "beyondpm-attachments";

export class GitHubError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

// Plain-language messages for the failures people actually hit.
function explain(status: number, fallback: string) {
  if (status === 401) return "Your GitHub sign-in has expired. Please sign in again.";
  if (status === 403) return "GitHub refused this. You may not have access to this board, or you've hit the hourly limit; try again in a few minutes.";
  if (status === 404) return "GitHub couldn't find that. It may have been deleted, or you don't have access.";
  return fallback;
}

export function createGitHubSource(token: string): DataSource {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/vnd.github+json" };

  async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch("https://api.github.com/graphql", { method: "POST", headers, body: JSON.stringify({ query, variables }) });
    if (!res.ok) throw new GitHubError(explain(res.status, `GitHub returned ${res.status}.`), res.status);
    const json = await res.json();
    if (json.errors?.length) throw new GitHubError(json.errors[0].message);
    return json.data as T;
  }

  async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new GitHubError(explain(res.status, detail.message ?? `GitHub returned ${res.status}.`), res.status);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  const repoPath = `/repos/${config.owner}/${config.repo}`;
  // Writes go to the ticket's own repository; new tickets go to the configured one.
  const at = (t: { repo: string }) => `/repos/${t.repo}`;
  // The REST "id" (not the number) is what the sub-issue and dependency APIs expect.
  const restId = async (t: Ticket) => (await rest<{ id: number }>(`${at(t)}/issues/${t.number}`)).id;

  async function setField(board: Board, t: Ticket, name: FieldName, value: FieldValue) {
    const field = board.fields.find((f) => f.name === name);
    if (!field) throw new GitHubError(`The board has no "${name}" field.`);
    const vars = { p: board.projectId, i: t.itemId, f: field.id };
    if (value === null || value === undefined || value === "") {
      await gql(`mutation($p:ID!,$i:ID!,$f:ID!){clearProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f}){clientMutationId}}`, vars);
      return;
    }
    let input: Record<string, unknown>;
    if (field.kind === "single") {
      const option = field.options.find((o) => o.name === value);
      if (!option) throw new GitHubError(`"${value}" isn't an option for ${name}.`);
      input = { singleSelectOptionId: option.id };
    } else if (field.kind === "iteration") input = { iterationId: value };
    else if (field.kind === "date") input = { date: value };
    else if (field.kind === "number") input = { number: Number(value) };
    else input = { text: String(value) };
    await gql(`mutation($p:ID!,$i:ID!,$f:ID!,$v:ProjectV2FieldValue!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:$v}){clientMutationId}}`, { ...vars, v: input });
  }

  return {
    mode: "github",

    async load() {
      const head = await gql<HeadResult>(HEAD_QUERY, { owner: config.owner, repo: config.repo, number: config.projectNumber });
      const project = head.organization?.projectV2;
      if (!project) throw new GitHubError(`Board #${config.projectNumber} wasn't found in ${config.owner}, or you don't have access to it.`);
      const tickets: Ticket[] = [];
      let after: string | null = null;
      do {
        const page: ItemsResult = await gql<ItemsResult>(ITEMS_QUERY, { id: project.id, after });
        const items = page.node.items;
        for (const n of items.nodes) if (n.content?.__typename === "Issue") tickets.push(toTicket(n));
        after = items.pageInfo.hasNextPage ? items.pageInfo.endCursor : null;
      } while (after);

      return {
        projectId: project.id,
        projectTitle: project.title,
        repoId: head.repository.id,
        fields: project.fields.nodes.map(toField).filter((f): f is Field => f !== null),
        labels: head.repository.labels.nodes,
        people: head.repository.assignableUsers.nodes,
        viewer: head.viewer,
        tickets,
      };
    },

    setField,

    async setAssignees(_board, t, logins) {
      const current = t.assignees.map((a) => a.login);
      const add = logins.filter((l) => !current.includes(l));
      const remove = current.filter((l) => !logins.includes(l));
      if (add.length) await rest(`${at(t)}/issues/${t.number}/assignees`, { method: "POST", body: JSON.stringify({ assignees: add }) });
      if (remove.length) await rest(`${at(t)}/issues/${t.number}/assignees`, { method: "DELETE", body: JSON.stringify({ assignees: remove }) });
    },

    async setLabels(_board, t, labels) {
      await rest(`${at(t)}/issues/${t.number}/labels`, { method: "PUT", body: JSON.stringify({ labels }) });
    },

    async setState(t, state, reason) {
      await rest(`${at(t)}/issues/${t.number}`, {
        method: "PATCH",
        body: JSON.stringify({ state: state === "OPEN" ? "open" : "closed", state_reason: state === "OPEN" ? "reopened" : reason === "NOT_PLANNED" ? "not_planned" : "completed" }),
      });
    },

    async updateText(t, patch) {
      await rest(`${at(t)}/issues/${t.number}`, { method: "PATCH", body: JSON.stringify(patch) });
    },

    async comments(t) {
      const list = await rest<RestComment[]>(`${at(t)}/issues/${t.number}/comments?per_page=100`);
      return list.map(toComment);
    },

    async addComment(t, body) {
      return toComment(await rest<RestComment>(`${at(t)}/issues/${t.number}/comments`, { method: "POST", body: JSON.stringify({ body }) }));
    },

    // GitHub's issue timeline: labels, assignees, renames, closes, links.
    // Project field changes appear when GitHub reports them (status changes).
    async history(t) {
      type Ev = { id?: number; node_id?: string; event: string; created_at?: string; actor?: { login: string; avatar_url: string } | null;
        label?: { name: string }; assignee?: { login: string }; rename?: { from: string; to: string }; state_reason?: string | null;
        source?: { issue?: { number: number; title: string } }; project_card?: unknown; previous_status?: string; status?: string };
      const list = await rest<Ev[]>(`${at(t)}/issues/${t.number}/timeline?per_page=100`);
      const out: HistoryEvent[] = [{ id: "created", at: t.createdAt, actor: t.author ?? null, kind: "created" }];
      for (const e of list) {
        if (!e.created_at || e.event === "commented") continue;
        const base = { id: String(e.id ?? e.node_id ?? `${e.event}-${e.created_at}`), at: e.created_at, actor: e.actor ? { login: e.actor.login, avatarUrl: e.actor.avatar_url } : null };
        switch (e.event) {
          case "labeled": out.push({ ...base, kind: "labeled", to: e.label?.name }); break;
          case "unlabeled": out.push({ ...base, kind: "unlabeled", from: e.label?.name }); break;
          case "assigned": out.push({ ...base, kind: "assigned", to: e.assignee?.login }); break;
          case "unassigned": out.push({ ...base, kind: "unassigned", from: e.assignee?.login }); break;
          case "renamed": out.push({ ...base, kind: "renamed", from: e.rename?.from, to: e.rename?.to }); break;
          case "closed": out.push({ ...base, kind: "closed", text: e.state_reason === "not_planned" ? "won't do" : "completed" }); break;
          case "reopened": out.push({ ...base, kind: "reopened" }); break;
          case "cross-referenced": if (e.source?.issue) out.push({ ...base, kind: "linked", to: `#${e.source.issue.number} ${e.source.issue.title}` }); break;
          case "parent_issue_added": case "sub_issue_added": case "parent_issue_removed": case "sub_issue_removed":
            out.push({ ...base, kind: "parent", text: e.event.replace(/_/g, " ") }); break;
          case "project_v2_item_status_changed": out.push({ ...base, kind: "status", from: e.previous_status, to: e.status }); break;
          default: if (!/^(subscribed|mentioned|referenced|unsubscribed)$/.test(e.event)) out.push({ ...base, kind: "other", text: e.event.replace(/_/g, " ") });
        }
      }
      return out;
    },

    async updateComment(t, c, body) {
      await rest(`${at(t)}/issues/comments/${c.restId}`, { method: "PATCH", body: JSON.stringify({ body }) });
    },

    async deleteComment(t, c) {
      await rest(`${at(t)}/issues/comments/${c.restId}`, { method: "DELETE" });
    },

    async dependencies(t) {
      const [by, ing] = await Promise.all([
        rest<{ html_url: string }[]>(`${at(t)}/issues/${t.number}/dependencies/blocked_by?per_page=100`),
        rest<{ html_url: string }[]>(`${at(t)}/issues/${t.number}/dependencies/blocking?per_page=100`),
      ]);
      return { blockedBy: by.map((i) => i.html_url), blocking: ing.map((i) => i.html_url) };
    },

    async addBlocker(t, blocker) {
      await rest(`${at(t)}/issues/${t.number}/dependencies/blocked_by`, { method: "POST", body: JSON.stringify({ issue_id: await restId(blocker) }) });
    },

    async removeBlocker(t, blocker) {
      await rest(`${at(t)}/issues/${t.number}/dependencies/blocked_by/${await restId(blocker)}`, { method: "DELETE" });
    },

    async setParent(t, parent, current) {
      const id = await restId(t);
      if (current) await rest(`${at(current)}/issues/${current.number}/sub_issue`, { method: "DELETE", body: JSON.stringify({ sub_issue_id: id }) });
      if (parent) await rest(`${at(parent)}/issues/${parent.number}/sub_issues`, { method: "POST", body: JSON.stringify({ sub_issue_id: id }) });
    },

    async attach(t, file) {
      if (file.size > 20 * 1024 * 1024) throw new GitHubError("That file is over 20 MB. Please attach something smaller, or link to it instead.");
      const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80);
      const path = `.attachments/${t.number}/${Date.now()}-${safe}`;
      const content = await toBase64(file);
      // Files go to their own branch so attachments never add commits to main.
      const put = () => rest<{ content: { html_url: string } }>(`${at(t)}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({ message: `chore(attachments): add ${safe} to #${t.number}`, content, branch: ATTACH_BRANCH }),
      });
      const res = await put().catch(async (e) => {
        if (!(e instanceof GitHubError) || (e.status !== 404 && e.status !== 422)) throw e;
        const repo = await rest<{ default_branch: string }>(at(t));
        const head = await rest<{ object: { sha: string } }>(`${at(t)}/git/ref/heads/${repo.default_branch}`);
        await rest(`${at(t)}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${ATTACH_BRANCH}`, sha: head.object.sha }) });
        return put();
      });
      const isImage = file.type.startsWith("image/");
      const url = res.content.html_url + (isImage ? "?raw=true" : "");
      await rest(`${at(t)}/issues/${t.number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: `📎 Attached **${file.name}**\n\n${isImage ? `![${file.name}](${url})` : `[${file.name}](${url})`}` }),
      });
      return { name: file.name, url, isImage };
    },

    async logTime(board, t, minutes, note) {
      const h = Math.floor(minutes / 60), m = minutes % 60;
      await rest(`${at(t)}/issues/${t.number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: `⏱️ Logged **${h ? `${h}h ` : ""}${m}m**${note ? ` — ${note}` : ""}` }),
      });
      // Adds to the board's time field (Settings → Workflow) when it has one.
      const timeField = workspace().timeField;
      if (timeField) {
        const current = Number((t.fields as Record<string, unknown>)[timeField] ?? 0);
        await setField(board, t, timeField as FieldName, Math.round((current + minutes / 60) * 100) / 100);
      }
    },

    async createLabel(l) {
      await rest(`${repoPath}/labels`, { method: "POST", body: JSON.stringify({ name: l.name, color: l.color.replace("#", ""), description: l.description ?? "" }) });
    },

    async updateLabel(name, patch) {
      await rest(`${repoPath}/labels/${encodeURIComponent(name)}`, {
        method: "PATCH",
        body: JSON.stringify({ new_name: patch.name, color: patch.color?.replace("#", ""), description: patch.description ?? undefined }),
      });
    },

    async deleteLabel(name) {
      await rest(`${repoPath}/labels/${encodeURIComponent(name)}`, { method: "DELETE" });
    },

    async create(board, input: NewTicket) {
      const issue = await rest<{ number: number; node_id: string; id: number }>(`${repoPath}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: input.title, body: input.body, labels: input.labels, assignees: input.assignees }),
      });
      const added = await gql<{ addProjectV2ItemById: { item: { id: string } } }>(
        `mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}`,
        { p: board.projectId, c: issue.node_id },
      );
      const ticket = { itemId: added.addProjectV2ItemById.item.id, number: issue.number } as Ticket;
      for (const [name, value] of Object.entries(input.fields) as [FieldName, FieldValue][]) {
        if (value !== undefined && value !== null && value !== "") await setField(board, ticket, name, value);
      }
      if (input.parent) {
        await rest(`${repoPath}/issues/${input.parent}/sub_issues`, { method: "POST", body: JSON.stringify({ sub_issue_id: issue.id }) }).catch(() => {
          /* the parent may be in another repository; the link is still in the body */
        });
      }
      return issue.number;
    },
  };
}

// ── Queries and mapping ──────────────────────────────────────────────────

const HEAD_QUERY = `query($owner:String!,$repo:String!,$number:Int!){
  viewer{login avatarUrl name}
  repository(owner:$owner,name:$repo){ id
    labels(first:100){nodes{name color description}}
    assignableUsers(first:100){nodes{login avatarUrl name}} }
  organization(login:$owner){ projectV2(number:$number){ id title
    fields(first:50){nodes{ __typename
      ... on ProjectV2FieldCommon{id name dataType}
      ... on ProjectV2SingleSelectField{options{id name color description}}
      ... on ProjectV2IterationField{configuration{
        iterations{id title startDate duration} completedIterations{id title startDate duration}}} }} } } }`;

const ITEMS_QUERY = `query($id:ID!,$after:String){ node(id:$id){ ... on ProjectV2{
  items(first:100,after:$after){ pageInfo{hasNextPage endCursor} nodes{ id
    content{ __typename ... on Issue{ id number title body url state stateReason createdAt updatedAt closedAt
      author{login avatarUrl} assignees(first:10){nodes{login avatarUrl name}} labels(first:30){nodes{name color}}
      comments{totalCount} parent{number url} repository{nameWithOwner} subIssuesSummary{total completed} } }
    fieldValues(first:30){ nodes{ __typename
      ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}}
      ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2FieldCommon{name}}}
      ... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2FieldCommon{name}}}
      ... on ProjectV2ItemFieldIterationValue{iterationId field{... on ProjectV2FieldCommon{name}}} } } } } } } }`;

type HeadResult = {
  viewer: Person;
  repository: { id: string; labels: { nodes: Label[] }; assignableUsers: { nodes: Person[] } };
  organization: { projectV2: { id: string; title: string; fields: { nodes: RawField[] } } | null } | null;
};
type RawField = {
  __typename: string; id: string; name: string; dataType: string;
  options?: { id: string; name: string; color: string; description: string }[];
  configuration?: { iterations: Iter[]; completedIterations: Iter[] };
};
type Iter = { id: string; title: string; startDate: string; duration: number };
type RawItem = {
  id: string;
  content: null | {
    __typename: string; id: string; number: number; title: string; body: string; url: string; state: "OPEN" | "CLOSED";
    stateReason: string | null; createdAt: string; updatedAt: string; closedAt: string | null; author: Person | null;
    assignees: { nodes: Person[] }; labels: { nodes: Label[] }; comments: { totalCount: number };
    parent: { number: number; url: string } | null; repository: { nameWithOwner: string }; subIssuesSummary: { total: number; completed: number } | null;
  };
  fieldValues: { nodes: { __typename: string; name?: string; date?: string; number?: number; iterationId?: string; field?: { name: string } }[] };
};
type ItemsResult = { node: { items: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: RawItem[] } } };
type RestComment = { id: number; node_id: string; body: string; created_at: string; updated_at?: string; user: { login: string; avatar_url: string } | null };

function toField(f: RawField): Field | null {
  if (f.dataType === "SINGLE_SELECT" && f.options) return { id: f.id, name: f.name, kind: "single", options: f.options };
  if (f.dataType === "ITERATION" && f.configuration)
    return { id: f.id, name: f.name, kind: "iteration", iterations: [...f.configuration.completedIterations, ...f.configuration.iterations].sort((a, b) => a.startDate.localeCompare(b.startDate)) };
  if (f.dataType === "DATE") return { id: f.id, name: f.name, kind: "date" };
  if (f.dataType === "NUMBER") return { id: f.id, name: f.name, kind: "number" };
  if (f.dataType === "TEXT") return { id: f.id, name: f.name, kind: "text" };
  return null;
}

function toTicket(n: RawItem): Ticket {
  const c = n.content!;
  const fields: Record<string, unknown> = {};
  for (const v of n.fieldValues.nodes) {
    const name = v.field?.name;
    if (!name) continue;
    fields[name] = v.name ?? v.date ?? v.number ?? v.iterationId;
  }
  return {
    itemId: n.id, issueId: c.id, number: c.number, title: c.title, body: c.body, url: c.url, state: c.state,
    stateReason: c.stateReason, createdAt: c.createdAt, updatedAt: c.updatedAt, closedAt: c.closedAt, author: c.author,
    assignees: c.assignees.nodes, labels: c.labels.nodes, commentCount: c.comments.totalCount, parent: c.parent?.number ?? null,
    parentUrl: c.parent?.url ?? null, repo: c.repository.nameWithOwner,
    subIssues: c.subIssuesSummary ?? { total: 0, completed: 0 }, fields: fields as FieldValues,
  };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new GitHubError("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

function toComment(c: RestComment): Comment {
  return { id: c.node_id, restId: c.id, body: c.body, createdAt: c.created_at, editedAt: c.updated_at && c.updated_at !== c.created_at ? c.updated_at : undefined, author: c.user ? { login: c.user.login, avatarUrl: c.user.avatar_url } : null };
}
