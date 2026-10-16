import { config } from "./config";

// The GitHub token lives in this browser only. Storage can be unavailable
// (private windows, blocked site data), so every access is guarded.
const TOKEN_KEY = "beyondpm.token";
const STATE_KEY = "beyondpm.oauth-state";
const DEMO_KEY = "beyondpm.demo";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY), null);
export const setToken = (t: string) => safe(() => { localStorage.setItem(TOKEN_KEY, t); localStorage.removeItem(DEMO_KEY); }, undefined);
export const signOut = () => safe(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(DEMO_KEY); localStorage.removeItem(RENEW_KEY); }, undefined);

// GitHub App sign-ins expire after 8 hours. The refresh token (single use,
// six months) renews them through the sign-in Worker, so people stay signed in.
const RENEW_KEY = "beyondpm.renew";
type Renew = { refresh: string; expiresAt: number };
const readRenew = (): Renew | null => safe(() => JSON.parse(localStorage.getItem(RENEW_KEY) || "null") as Renew | null, null);
function keepSession(json: { access_token: string; refresh_token?: string; expires_in?: number }) {
  setToken(json.access_token);
  safe(() => {
    if (json.refresh_token && json.expires_in) localStorage.setItem(RENEW_KEY, JSON.stringify({ refresh: json.refresh_token, expiresAt: Date.now() + json.expires_in * 1000 }));
    else localStorage.removeItem(RENEW_KEY);
  }, undefined);
}
/** True when the token expires within the next few minutes (or already has). */
export const expiresSoon = (withinMs = 10 * 60_000) => { const r = readRenew(); return !!r && r.expiresAt - Date.now() < withinMs; };
export const canRenew = () => !!readRenew() && !!config.authWorkerUrl;

let renewing: Promise<boolean> | null = null;
/** Swap the refresh token for a fresh sign-in. Resolves false if that's not possible. */
export function renewSession(): Promise<boolean> {
  const r = readRenew();
  if (!r || !config.authWorkerUrl) return Promise.resolve(false);
  renewing ??= fetch(config.authWorkerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: r.refresh }) })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.access_token) return false;
      keepSession(json);
      return true;
    })
    .catch(() => false)
    .finally(() => { renewing = null; });
  return renewing;
}
export const isDemo = () => safe(() => localStorage.getItem(DEMO_KEY) === "1", false);
export const startDemo = () => safe(() => localStorage.setItem(DEMO_KEY, "1"), undefined);

const callbackUrl = () => `${window.location.origin}${config.basePath}/auth/callback/`;

export function startLogin() {
  const state = crypto.randomUUID();
  safe(() => sessionStorage.setItem(STATE_KEY, state), undefined);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.oauthClientId);
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("scope", "repo read:org project");
  url.searchParams.set("state", state);
  window.location.assign(url.toString());
}

/** Throws unless the token's account is an active member of an allowed organisation. */
export async function checkMembership(token: string): Promise<void> {
  if (!config.allowedOrgs.length) return;
  for (const org of config.allowedOrgs) {
    const res = await fetch(`https://api.github.com/user/memberships/orgs/${encodeURIComponent(org)}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }).catch(() => null);
    if (res?.ok && (await res.json().catch(() => ({}))).state === "active") return;
  }
  throw new Error(`Only members of ${config.allowedOrgs.join(" or ")} can use this workspace. Ask an admin to add your GitHub account to the organisation.`);
}

// Called on /auth/callback: checks the state, then asks the sign-in Worker to
// swap the one-time code for a token (the Worker holds the client secret).
export async function finishLogin(params: URLSearchParams): Promise<void> {
  const error = params.get("error_description") || params.get("error");
  if (error) throw new Error(error);
  const code = params.get("code");
  const state = params.get("state");
  const expected = safe(() => sessionStorage.getItem(STATE_KEY), null);
  if (!code) throw new Error("GitHub didn't send a sign-in code. Please try again.");
  if (!state || state !== expected) throw new Error("This sign-in link has expired or was opened in another tab. Please try again.");
  const res = await fetch(config.authWorkerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: callbackUrl() }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(json.error_description || json.error || "Sign-in failed. Please try again.");
  safe(() => sessionStorage.removeItem(STATE_KEY), undefined);
  await checkMembership(json.access_token);
  keepSession(json);
}
