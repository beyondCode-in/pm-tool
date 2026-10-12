# GitHub sign-in and access control

How "Continue with GitHub" works for BeyondPM, what is configured where, and how
to change it. No secret values are stored in this file or anywhere in the
repository.

## How it works

1. The person clicks **Continue with GitHub** on the login page and approves
   BeyondPM on github.com.
2. GitHub sends them back to `/pm-tool/auth/callback/` with a one-time code.
3. The app sends that code to the **sign-in helper**, a small Cloudflare Worker
   (`web/worker/oauth-worker.js`). Only the helper knows the Client Secret.
4. The helper swaps the code for a GitHub access token, then checks that the
   account is an **active member of an allowed organisation**. If it isn't, the
   helper revokes the token on the spot and refuses the sign-in.
5. The app checks membership again and keeps the token **only in that
   browser**. Signing out deletes it.

### Why a helper is needed at all

GitHub Pages only serves static files. Everything on it is downloaded by every
visitor, so it cannot keep a secret. GitHub's token endpoint also refuses
requests made from web pages (CORS). One tiny server-side step is therefore
unavoidable. The helper stores nothing and logs nothing.

## Who can get in

| Layer | What it does |
| --- | --- |
| Members-only gate (`ALLOWED_ORGS`) | Only active members of the listed organisations can sign in, by GitHub sign-in or by pasted token. |
| GitHub permissions | A signed-in member sees only the repositories and projects their own GitHub account can open. |
| Removing access | Remove the person from the organisation on GitHub. A private board is closed to them immediately. |

> ⚠️ **A public repository is public on github.com, whatever the app does.**
> The gate protects the app, not GitHub itself. Keep company work in a
> **private** repository with a **private** project. This repository
> (`pm-tool`, the app's code) can stay public.

## Configuration

### GitHub OAuth app

- Location: `beyondCode-in` organisation → Settings → Developer settings → OAuth Apps → **BeyondPM**.
- Homepage URL: `https://beyondcode-in.github.io/pm-tool/`
- Authorization callback URL: `https://beyondcode-in.github.io/pm-tool/auth/callback/`
- Client ID: `Ov23liWmsKAK1QQkP34o` (public by design)
- Client Secret: stored **only** in Cloudflare (see below). Never commit it.

### Cloudflare Worker (the sign-in helper)

- Name: `beyondpm-oauth`, in the Cloudflare account `akshaykumarpatil33@gmail.com`.
- URL: `https://beyondpm-oauth.akshaykumarpatil33.workers.dev`
- Code and settings: `web/worker/oauth-worker.js` and `web/worker/wrangler.toml`.

| Setting | Kind | Value |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | secret | the Client ID |
| `GITHUB_CLIENT_SECRET` | secret | the Client Secret |
| `ALLOWED_ORIGIN` | variable (`wrangler.toml`) | `https://beyondcode-in.github.io` |
| `ALLOWED_ORGS` | variable (`wrangler.toml`) | `beyondCode-in` (comma-separated for several) |

### GitHub repository variables

Settings → Secrets and variables → Actions → **Variables**. The Pages workflow
(`.github/workflows/web-pages.yml`) builds them into the site. They are not
secret.

| Variable | Value | Used as |
| --- | --- | --- |
| `OAUTH_CLIENT_ID` | `Ov23liWmsKAK1QQkP34o` | `NEXT_PUBLIC_OAUTH_CLIENT_ID` |
| `AUTH_WORKER_URL` | `https://beyondpm-oauth.akshaykumarpatil33.workers.dev` | `NEXT_PUBLIC_AUTH_WORKER_URL` |
| `ALLOWED_ORGS` | `beyondCode-in` | `NEXT_PUBLIC_ALLOWED_ORGS` |

The Client Secret is deliberately **not** a GitHub secret: the website never needs it.

## Common tasks

Run these from `web/worker` after `npx wrangler login`.

**Deploy the helper after changing its code or `wrangler.toml`:**
```
npx wrangler deploy
```

**Rotate the Client Secret:**
1. In the OAuth app on GitHub, click **Generate a new client secret**.
2. Run `npx wrangler secret put GITHUB_CLIENT_SECRET` and paste the new secret.
3. Delete the old secret in the OAuth app.

**Allow another organisation:**
1. Edit `ALLOWED_ORGS` in `web/worker/wrangler.toml`, for example `beyondCode-in,other-org`, then run `npx wrangler deploy`.
2. Run `gh variable set ALLOWED_ORGS --body "beyondCode-in,other-org"`, then rerun the **Publish web app** workflow.

**Turn the members-only gate off:** remove `ALLOWED_ORGS` from both places, then redeploy and republish.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "client_id and/or client_secret incorrect" | The helper's secrets don't match the OAuth app. Set both again with `wrangler secret put`. |
| "Only members of … can sign in" | The account isn't an active member, or didn't grant the app access to the organisation on GitHub's approval screen. Add them to the organisation, or have them re-approve and grant access. |
| "origin_not_allowed" | The site's address doesn't match `ALLOWED_ORIGIN`. |
| Signed in but no boards | The account lacks access to that repository or project, or the organisation restricts OAuth apps. An owner approves BeyondPM under Settings → Third-party access. |
| "redirect_uri mismatch" on GitHub | The OAuth app's callback URL must be exactly `https://beyondcode-in.github.io/pm-tool/auth/callback/`. |
