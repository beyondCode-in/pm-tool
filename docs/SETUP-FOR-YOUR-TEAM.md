# Use BeyondPM for your team

BeyondPM runs on top of a GitHub project board. There is no server and no
database: every ticket is a GitHub issue, every stage and priority is a field
on your board, and each person signs in with their own GitHub account, so they
see exactly what GitHub already lets them see.

There are two ways to use it. Pick one, or both.

| | **Shared site** | **Your own copy** |
|---|---|---|
| What it is | Open the hosted site, sign in, pick your board | A copy of this repository in your organisation, with its own site |
| Setup time | About 2 minutes | About 10 minutes |
| You get | The web app on any board | The web app **plus** issue forms and automations (triage, SLA reminders, board health, weekly report) running in your repo |
| Address | `https://beyondcode-in.github.io/pm-tool/` | `https://<your-org>.github.io/<your-repo>/` |
| Board | Chosen after sign-in, can be switched | Locked to your board (optional) |

## Shared site (fastest)

1. Open the site and choose **Continue with GitHub** (or paste a token, see below).
2. Pick your **organisation**, then the **board** (or create a new one), then the
   **repository** where new tickets and tags should live.
3. On the last step, **Set up board** adds anything the app expects that your
   board is missing: the Priority, Ticket Type, Size, Component, Story Points,
   Start date, Target date and Sprint fields, and a standard set of tags.
   Nothing that already exists is renamed or removed. A brand-new, empty board
   also gets the full set of stages (Backlog → Todo → In Progress → Code Review
   → QA & Testing → Done).
4. **Copy link for your team** and share it. The link opens straight into your
   board for anyone with access.

Switch boards at any time from your profile menu → **Switch board…**.

> **Organisation not listed?** If your organisation restricts third-party apps,
> an owner has to approve the BeyondPM app once under
> *Organisation settings → Third-party access*.

## Your own copy

1. On this repository choose **Use this template → Create a new repository**,
   and create it in your organisation (for example `acme/pm`).
2. Create a project board in your organisation (or use an existing one) and
   note its number: `github.com/orgs/acme/projects/`**`5`**.
3. In the new repository, open *Settings → Secrets and variables → Actions*:
   - **Variables**
     - `PROJECT_NUMBER` = `5`
     - `PIN_BOARD` = `true` to lock the site to this board (leave it out to let
       people pick any board after signing in)
     - `OAUTH_CLIENT_ID`, `AUTH_WORKER_URL`: only for the
       "Continue with GitHub" button, see below
   - **Secrets**
     - `PROJECT_TOKEN`: a fine-grained token with *Projects: read & write* on
       the organisation and *Issues: read & write* on the repo. The automations
       use it to move cards.
4. *Settings → Pages → Source*: **GitHub Actions**.
5. Run the **Publish web app** workflow (or push any change to `web/`). Your
   site appears at `https://acme.github.io/pm/`.
6. Sign in once and run **Set up board** (the connect screen offers it; on a
   locked copy, use *Settings → Workflow* to review the rules).

## Signing in

- **Token (works everywhere, no setup):** on the sign-in page choose
  *Use a GitHub access token instead*. Create one with the `repo`, `read:org`
  and `project` scopes. It stays in that browser only.
- **"Continue with GitHub" button:** create a GitHub OAuth app (callback URL
  `https://<site>/auth/callback/`), deploy the small sign-in Worker in
  `web/worker/` with the app's secret, then set `OAUTH_CLIENT_ID` and
  `AUTH_WORKER_URL`. Do this once for the shared site; a company's own copy can
  reuse the shared one or bring its own.

## Who can do what

Permissions come from GitHub, not from BeyondPM:

| Person | Can |
|---|---|
| Organisation owner / repo admin | Everything, including creating and deleting tags and setting up the board |
| Write access to the repo + project | Create, edit and move tickets; log time; comment |
| Read access | View boards and tickets |
| No access | Sees nothing; the board isn't listed |

## What is stored where

| Thing | Stored in |
|---|---|
| Tickets, comments, time entries, history | GitHub issues and their timeline |
| Stages, priority, sprint, dates, points | Fields on your GitHub project board |
| Tags | Labels on the chosen repository |
| Attachments | The `beyondpm-attachments` branch of the repository |
| Layouts, favourites, workflow rules, theme | Each person's browser |
