// Everything that ties the app to one GitHub organisation, repository and
// project board. Set these as repository variables for the Pages build
// (see web/README.md); the defaults point at beyondCode-in's board.
export const config = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "beyondCode-in",
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "pm-tool",
  projectNumber: Number(process.env.NEXT_PUBLIC_PROJECT_NUMBER ?? 34),
  // GitHub OAuth app client ID (public) and the Cloudflare Worker that swaps the
  // login code for a token (it holds the client secret).
  oauthClientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "",
  authWorkerUrl: process.env.NEXT_PUBLIC_AUTH_WORKER_URL ?? "",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export const oauthEnabled = Boolean(config.oauthClientId && config.authWorkerUrl);
