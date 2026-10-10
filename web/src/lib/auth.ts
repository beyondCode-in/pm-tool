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
export const signOut = () => safe(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(DEMO_KEY); }, undefined);
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
  setToken(json.access_token);
}
