// Finding boards and preparing them. Uses only the signed-in person's token,
// so every list shows exactly what GitHub lets that person see.

import { getToken } from "./auth";
import { FIELDS, LABELS, STATUSES } from "./blueprint";
import type { Tenant } from "./tenant";

const api = "https://api.github.com";
const headers = () => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", Accept: "application/vnd.github+json" });

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${api}/graphql`, { method: "POST", headers: headers(), body: JSON.stringify({ query, variables }) });
  if (res.status === 401) throw new Error("Your GitHub sign-in has expired. Sign in again.");
  const json = await res.json().catch(() => ({}));
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!res.ok) throw new Error(`GitHub returned ${res.status}.`);
  return json.data as T;
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${api}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => null)) as T };
}

export type Owner = { login: string; name: string | null; avatarUrl: string; kind: "user" | "org"; projects: { number: number; title: string; closed: boolean; updatedAt: string }[] };

/** You and every organisation you belong to, each with its project boards. */
export async function listOwners(): Promise<Owner[]> {
  const projects = "projectsV2(first:50,orderBy:{field:UPDATED_AT,direction:DESC}){nodes{number title closed updatedAt}}";
  const d = await gql<{ viewer: { login: string; name: string | null; avatarUrl: string; projectsV2: { nodes: Owner["projects"] };
    organizations: { nodes: { login: string; name: string | null; avatarUrl: string; projectsV2: { nodes: Owner["projects"] } }[] } } }>(
    `query{ viewer{ login name avatarUrl ${projects} organizations(first:100){nodes{ login name avatarUrl ${projects} }} } }`);
  const v = d.viewer;
  return [
    ...v.organizations.nodes.map((o) => ({ login: o.login, name: o.name, avatarUrl: o.avatarUrl, kind: "org" as const, projects: o.projectsV2.nodes })),
    { login: v.login, name: v.name, avatarUrl: v.avatarUrl, kind: "user" as const, projects: v.projectsV2.nodes },
  ];
}

/** Repositories of an owner you can push to (new tickets and tags live in one). */
export async function listRepos(owner: Owner): Promise<{ name: string; private: boolean; pushedAt: string }[]> {
  const path = owner.kind === "org" ? `/orgs/${owner.login}/repos?per_page=100&sort=pushed` : `/user/repos?per_page=100&sort=pushed&affiliation=owner`;
  const r = await rest<{ name: string; private: boolean; pushed_at: string; archived: boolean; permissions?: { push: boolean } }[]>(path);
  if (!r.ok) throw new Error(`Couldn't list repositories (${r.status}).`);
  return r.data.filter((x) => !x.archived && x.permissions?.push !== false).map((x) => ({ name: x.name, private: x.private, pushedAt: x.pushed_at }));
}

/** Create a project board for an owner. */
export async function createProject(ownerLogin: string, title: string): Promise<number> {
  const o = await gql<{ repositoryOwner: { id: string } | null }>(`query($l:String!){ repositoryOwner(login:$l){ id } }`, { l: ownerLogin });
  if (!o.repositoryOwner) throw new Error(`${ownerLogin} wasn't found.`);
  const d = await gql<{ createProjectV2: { projectV2: { number: number } } }>(
    `mutation($o:ID!,$t:String!){ createProjectV2(input:{ownerId:$o,title:$t}){ projectV2{ number } } }`, { o: o.repositoryOwner.id, t: title });
  return d.createProjectV2.projectV2.number;
}

export type SetupStep = { label: string; state: "done" | "skipped" | "failed"; detail?: string };

type ProjectHead = { id: string; title: string; items: { totalCount: number }; fields: { nodes: { id?: string; name?: string; dataType?: string; options?: { name: string; color: string; description: string }[] }[] } };

/** What a board is missing compared with the blueprint (nothing is changed). */
export async function inspectBoard(t: Tenant) {
  const d = await gql<{ repositoryOwner: { projectV2: ProjectHead | null } | null; repository: { labels: { nodes: { name: string }[] } } | null }>(
    `query($o:String!,$r:String!,$n:Int!){
      repositoryOwner(login:$o){ ... on ProjectV2Owner{ projectV2(number:$n){ id title items{ totalCount } fields(first:50){ nodes{ ... on ProjectV2FieldCommon{ id name dataType } ... on ProjectV2SingleSelectField{ options{ name color description } } } } } } }
      repository(owner:$o,name:$r){ labels(first:100){ nodes{ name } } } }`, { o: t.owner, r: t.repo, n: t.project });
  const project = d.repositoryOwner?.projectV2;
  if (!project) throw new Error(`Board #${t.project} wasn't found in ${t.owner}, or you can't open it.`);
  if (!d.repository) throw new Error(`Repository ${t.owner}/${t.repo} wasn't found, or you can't open it.`);
  const have = new Set(project.fields.nodes.map((f) => f.name));
  const labels = new Set(d.repository.labels.nodes.map((l) => l.name.toLowerCase()));
  const status = project.fields.nodes.find((f) => f.name === "Status");
  return {
    project,
    missingFields: FIELDS.filter((f) => !have.has(f.name)),
    missingLabels: LABELS.filter((l) => !labels.has(l.name.toLowerCase())),
    // GitHub's default Status is Todo / In Progress / Done; offer the full set.
    // Only on an empty board: replacing options would clear the stage of existing tickets.
    statusIsDefault: !!status && (status.options?.length ?? 0) <= 3 && project.items.totalCount === 0,
    status,
  };
}

/** Add the missing fields, stages and tags. Safe to run more than once. */
export async function setupBoard(t: Tenant, onStep: (s: SetupStep) => void, opts: { stages: boolean } = { stages: true }) {
  const info = await inspectBoard(t);
  const pid = info.project.id;
  for (const f of info.missingFields) {
    try {
      const input: Record<string, unknown> = { projectId: pid, name: f.name };
      if (f.kind === "single") { input.dataType = "SINGLE_SELECT"; input.singleSelectOptions = f.options.map((o) => ({ name: o.name, color: o.color, description: o.description ?? "" })); }
      else if (f.kind === "number") input.dataType = "NUMBER";
      else if (f.kind === "date") input.dataType = "DATE";
      else if (f.kind === "iteration") {
        input.dataType = "ITERATION";
        const monday = new Date(); monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));
        const start = monday.toISOString().slice(0, 10);
        input.iterationConfiguration = { startDate: start, duration: f.weeks * 7,
          iterations: Array.from({ length: f.count }, (_, i) => {
            const d = new Date(monday); d.setDate(d.getDate() + i * f.weeks * 7);
            return { title: `Sprint ${i + 1}`, startDate: d.toISOString().slice(0, 10), duration: f.weeks * 7 };
          }) };
      }
      await gql(`mutation($i:CreateProjectV2FieldInput!){ createProjectV2Field(input:$i){ clientMutationId } }`, { i: input });
      onStep({ label: `Field "${f.name}"`, state: "done" });
    } catch (e) {
      onStep({ label: `Field "${f.name}"`, state: "failed", detail: (e as Error).message });
    }
  }
  if (opts.stages && info.statusIsDefault && info.status?.id) {
    try {
      await gql(`mutation($i:UpdateProjectV2FieldInput!){ updateProjectV2Field(input:$i){ clientMutationId } }`, {
        i: { fieldId: info.status.id, singleSelectOptions: STATUSES.map((o) => ({ name: o.name, color: o.color, description: "" })) } });
      onStep({ label: "Stages (Backlog → Done)", state: "done" });
    } catch (e) {
      onStep({ label: "Stages (Backlog → Done)", state: "failed", detail: (e as Error).message });
    }
  }
  for (const l of info.missingLabels) {
    const r = await rest(`/repos/${t.owner}/${t.repo}/labels`, { method: "POST", body: JSON.stringify(l) });
    onStep({ label: `Tag "${l.name}"`, state: r.ok ? "done" : r.status === 422 ? "skipped" : "failed", detail: r.ok ? undefined : `GitHub returned ${r.status}` });
  }
  return info;
}
