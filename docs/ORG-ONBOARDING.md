# Setting up BeyondPM for an organisation

Everything a company needs to start using BeyondPM with its **own private
repositories**, kept completely separate from every other organisation. It takes
about 15 minutes for an organisation owner, and nothing for members beyond
signing in.

- **Who does what:** steps 1–6 are for an **organisation owner**; step 7 is for
  **every member**.
- **What's needed:** a GitHub organisation (the free plan is fine). BeyondPM has
  no server or database of its own: all work stays in the organisation's GitHub.

---

## How organisations are kept apart

BeyondPM is one website shared by every organisation, but it holds no data.
After someone signs in, their browser fetches everything from GitHub **using
that person's own GitHub login**. So:

- People only ever see the organisations, projects and repositories **GitHub
  already lets them see**. Members of organisation B can't open organisation A's
  board, even with a link, because GitHub refuses them.
- Each organisation's tickets, docs, whiteboards and chat live in **its own
  private repositories**. Nothing is copied anywhere else.
- Removing someone from the organisation (or the repository) on GitHub removes
  their access in BeyondPM immediately.

---

## Step 1: Create the home repository (private)

The **home repository** holds everything that isn't a ticket field:

| Kept in the home repository | As |
| --- | --- |
| New tickets | GitHub issues |
| Docs | Markdown files in `docs/` |
| Whiteboards | `.excalidraw` files in `whiteboards/` |
| Chat | GitHub Discussions (one category = one channel) |
| Goals | GitHub milestones |
| Tags | GitHub labels |

1. Create a repository, for example `acme/work`, and set it to **Private**.
2. Under **Settings → General → Features**, tick **Discussions** (for Chat).

An existing private repository works just as well.

## Step 2: Create the board (a private GitHub Project)

1. In the organisation, open **Projects → New project**, pick **Board**, and name it.
2. In the project's **Settings**, set **Visibility** to **Private**.
3. Note its number from the address, for example `.../projects/12`.

You don't need to add any fields: BeyondPM adds them in step 6.

## Step 3: Let BeyondPM into the organisation

> **If BeyondPM signs in with a GitHub App** (see [SIGN-IN-SETUP.md](SIGN-IN-SETUP.md) → *Switching sign-in to a GitHub App*), this step is instead: an owner opens the **Install BeyondPM on an organisation** link on the Connect page, chooses the organisation and picks **only the repositories BeyondPM should use**. Repositories not picked stay invisible to BeyondPM, even for members.

With the classic OAuth app:

GitHub organisations can block third-party apps. If yours does (look under
**Settings → Third-party access → OAuth application policy**):

1. Ask one member to sign in to BeyondPM. On GitHub's approval screen they click
   **Request** next to the organisation.
2. An owner approves **BeyondPM** under **Settings → Third-party access**.

If the organisation has no restriction, there is nothing to do.

## Step 4: Ask for your organisation to be enabled

The hosted BeyondPM only accepts members of approved organisations (the
members-only gate). Send the BeyondPM administrator your organisation's GitHub
name, for example `acme`. They add it to the allowed list (see
[SIGN-IN-SETUP.md](SIGN-IN-SETUP.md) → *Allow another organisation*). Until then,
your members see "Only members of … can sign in".

> Companies that run **their own copy** of BeyondPM set their own allowed list
> and pin it to their board; see *Running your own copy* below.

## Step 5: Give people access

Use GitHub **teams**, so access is managed in one place:

1. **Organisation → Teams → New team**, for example `product`.
2. Add the team to the home repository with the right role:

   | Repository role | What the person can do in BeyondPM |
   | --- | --- |
   | Read | See tickets, docs, chat and history; no edits |
   | Triage | Also change tags and assignees, close and reopen |
   | Write | Everything: fields, new tickets, docs, whiteboards |
   | Maintain / Admin | Everything, plus repository settings on GitHub |

3. Add the team to the project (**Project → Settings → Manage access**) as
   **Write** (or **Read** for viewers).

People outside the team see nothing, even inside the same organisation.

## Step 6: Connect the board

1. Open BeyondPM and click **Continue with GitHub**.
2. On **Connect**, pick the organisation, the project from step 2 and the home
   repository from step 1.
3. Click **Set up board**. It adds Status, Priority, Points, Sprint, Start date
   and Target date, plus the default tags. It never removes anything.
4. Copy the board link from the workspace menu (it contains
   `?board=acme/work/12`) and share it with the team.

## Step 7: Members sign in

Members open the shared link and click **Continue with GitHub**. That's all:
no tokens, no setup. The first time, GitHub asks them to approve BeyondPM once.

---

## Your organisation's logo

BeyondPM shows the **organisation's GitHub profile picture** as the workspace
logo in the sidebar, with a small BeyondPM mark in its corner. To change it,
update the picture under **Organisation → Settings → Profile**. Every member
sees the new logo on their next refresh. There is nothing to upload to BeyondPM.

---

## Several private repositories

A board can show tickets from **any number of repositories** in the
organisation, for example `acme/web`, `acme/api` and `acme/mobile`.

**Bringing tickets in.** Add issues from other repositories to the same GitHub
Project. The easiest way is the project's built-in **Workflows → Auto-add to
project**, once per repository, with a filter such as `is:issue is:open`. From
then on, new issues in those repositories appear on the board automatically.

**How BeyondPM uses them:**

| Action | Where it happens |
| --- | --- |
| Editing a ticket (fields, comments, tags, checklist, closing) | The ticket's **own** repository |
| Creating a new ticket in BeyondPM | The **home** repository |
| Docs, whiteboards, chat, goals | The **home** repository |
| Tag choices and people you can assign | From the **home** repository |

**How access is controlled:** per repository, by GitHub. If someone can read
`acme/web` but not `acme/api`, the board shows them only the `acme/web` tickets;
GitHub hides the rest and BeyondPM skips them. Give each team access to the
repositories it should see (step 5).

**Separate boards per team or product.** Create one GitHub Project per team, each
connected in BeyondPM (step 6). People switch boards from the workspace menu,
and each board keeps its own notifications, reminders and saved views.

**Current limit:** a new ticket created in BeyondPM always goes into the home
repository. To file one in another repository, create it there on GitHub (or
move it with GitHub's **Transfer issue**); the auto-add workflow puts it on the
board.

---

## Optional: automation

The `pm-tool` repository includes GitHub Actions that turn form answers into
tags, keep the board in sync, send SLA reminders and post a weekly report. To
use them in your home repository:

1. Copy `.github/workflows/` and `.github/scripts/` into it.
2. Add a repository secret `PROJECT_TOKEN`: a fine-grained token with access
   to the project. The default token can't write to organisation projects.
3. Point them at your board: in `.github/scripts/project-sync.cjs`, set
   `PROJECT` to your organisation and project number (it ships as
   `{ owner: 'beyondCode-in', number: 34 }`), and update the project link in
   the welcome message in `.github/workflows/no-code-auto-triage.yml`.

Private repositories get 2,000 free Actions minutes a month, which is plenty for
these.

---

## Running your own copy

A company that wants its own address and full control can deploy BeyondPM
itself:

1. Fork or copy `pm-tool`, enable GitHub Pages (or any static host), and set the
   repository variables `PROJECT_NUMBER`, `PIN_BOARD=true`, `OAUTH_CLIENT_ID`,
   `AUTH_WORKER_URL` and `ALLOWED_ORGS`.
2. Create its own GitHub OAuth app and deploy its own sign-in helper, as
   described in [SIGN-IN-SETUP.md](SIGN-IN-SETUP.md).

`PIN_BOARD=true` locks that copy to the company's board, so nobody can switch it
to another one.

---

## Checklist

- [ ] Private home repository created, Discussions on
- [ ] Private GitHub Project created
- [ ] BeyondPM approved under Third-party access (if the organisation restricts apps)
- [ ] Organisation added to BeyondPM's allowed list
- [ ] Teams created and given repository and project access
- [ ] Board connected and **Set up board** run
- [ ] Board link shared with the team
- [ ] (Optional) Other repositories auto-added to the project
- [ ] (Optional) Automation copied and `PROJECT_TOKEN` set
