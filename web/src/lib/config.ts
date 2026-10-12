import { currentTenant, pinned } from "./tenant";

// Everything that ties the app to a GitHub organisation, repository and
// project board. The board is chosen at run time (lib/tenant.ts): fixed by
// the build in a company's own copy, picked after sign-in on the shared site.
export const config = {
  get owner() { return currentTenant()?.owner ?? ""; },
  get repo() { return currentTenant()?.repo ?? ""; },
  get projectNumber() { return currentTenant()?.project ?? 0; },
  /** True when this build is locked to one board (a company's own copy). */
  pinned,
  // GitHub OAuth app client ID (public) and the Cloudflare Worker that swaps the
  // login code for a token (it holds the client secret).
  oauthClientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "",
  authWorkerUrl: process.env.NEXT_PUBLIC_AUTH_WORKER_URL ?? "",
  /** Only members of these organisations may use the app (comma-separated; empty = anyone). */
  allowedOrgs: (process.env.NEXT_PUBLIC_ALLOWED_ORGS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export const oauthEnabled = Boolean(config.oauthClientId && config.authWorkerUrl);
export const hasBoard = () => !!currentTenant();
