// Which GitHub board this browser is working on.
//
// One codebase, two ways to run it:
//  • Your own copy (a company's fork/template): the Pages build sets the owner,
//    repo and project, and NEXT_PUBLIC_PIN_BOARD=true locks the app to it.
//  • The shared site: nothing is locked. After sign-in each person picks an
//    organisation, project and repository on /connect/, and links carry the
//    board (?board=owner/repo/34) so they can be shared.
// Either way the person's own GitHub access decides what they can see; there
// is no shared server holding anyone's data.

export type Tenant = { owner: string; repo: string; project: number };

const KEY = "beyondpm.tenant";
const env = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "",
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "",
  project: Number(process.env.NEXT_PUBLIC_PROJECT_NUMBER ?? 0),
};
export const pinned = process.env.NEXT_PUBLIC_PIN_BOARD === "true" && !!env.owner && !!env.project;

const valid = (t: Partial<Tenant> | null | undefined): t is Tenant =>
  !!t && /^[\w.-]+$/.test(t.owner ?? "") && /^[\w.-]+$/.test(t.repo ?? "") && Number.isInteger(t.project) && (t.project ?? 0) > 0;

/** "owner/repo/34" ⇄ Tenant, for links. */
export const encodeTenant = (t: Tenant) => `${t.owner}/${t.repo}/${t.project}`;
export function decodeTenant(s: string | null): Tenant | null {
  const m = /^([\w.-]+)\/([\w.-]+)\/(\d+)$/.exec(s ?? "");
  const t = m ? { owner: m[1], repo: m[2], project: Number(m[3]) } : null;
  return valid(t) ? t : null;
}

const fromUrl = () => { try { return decodeTenant(new URLSearchParams(window.location.search).get("board")); } catch { return null; } };
const fromStore = () => { try { const t = JSON.parse(localStorage.getItem(KEY) ?? "null"); return valid(t) ? t : null; } catch { return null; } };

let cached: Tenant | null | undefined;

/** The board in use: pinned build → link → last used → build default → none. */
export function currentTenant(): Tenant | null {
  if (pinned) return env;
  if (typeof window === "undefined") return valid(env) ? env : null;
  if (cached !== undefined) return cached;
  const linked = fromUrl();
  if (linked) { saveTenant(linked); return linked; }
  cached = fromStore() ?? (valid(env) ? env : null);
  return cached;
}

export function saveTenant(t: Tenant) {
  cached = t;
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* per-browser only */ }
}

export function forgetTenant() {
  cached = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** A link to this board that anyone with access can open. */
export const shareLink = (origin: string, basePath: string, t: Tenant) => `${origin}${basePath}/home/?board=${encodeTenant(t)}`;
