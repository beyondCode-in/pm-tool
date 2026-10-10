# BeyondPM: GitHub Native Integration Specification

**Document Version:** 1.0.0  
**Architect:** Senior DevOps Architect & Staff Full-Stack Engineer  
**Status:** Canonical Integration Blueprint  
**Target Repository:** `beyondCode-in/pm-tool`

---

## 1. Integration Philosophy & Boundary Model

The central premise of BeyondPM is:
> **GitHub = Engineering Source of Truth**  
> **BeyondPM = Planning, Workflow, Collaboration, Automation, Analytics, and Management Layer**

Developers interact directly with git, branches, pull requests, code reviews, and CI/CD pipelines in GitHub. BeyondPM automatically senses, correlates, and reflects all engineering activities in real time, synchronizing planning states without forcing engineers to leave their command line or IDE.

```
+-----------------------------------------------------------------------------------+
|                              GITHUB REPOSITORY & ORG                              |
|   Branches: feature/PM-142-auth        Commits: "PM-142: add oauth callback"      |
|   Pull Requests: #341 [PM-142]         Actions Checks: lint, test, security, e2e  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HMAC SHA-256 Webhooks)
+-----------------------------------------------------------------------------------+
|                        BEYONDPM WEBHOOK INGESTION ENGINE                          |
|                                                                                   |
|   1. Signature Verification (X-Hub-Signature-256)                                 |
|   2. Idempotency Deduplication (X-GitHub-Delivery)                                |
|   3. Asynchronous Worker Queue (BullMQ / In-Process Worker)                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        ENTITY CORRELATION & DISPATCHER                            |
|                                                                                   |
|   Regex Correlator: /(?:^|[\/\s_-])([A-Z]{2,10}-\d+)(?:[\/\s_:.-]|$)/gi           |
|                                                                                   |
|   Matches:                                                                        |
|   - Branch: feature/PM-142-auth           ──► Correlated to PM-142                |
|   - Commit: PM-142 add token validator    ──► Appended to PM-142 Commits          |
|   - PR: #341 Implement authentication     ──► Linked to PM-142 Pull Requests      |
|   - Checks: CI build & test success       ──► Updates PM-142 Development Panel    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        WORKFLOW & AUTOMATION ENGINE                               |
|                                                                                   |
|   Trigger: PR #341 Opened   ──► Move PM-142 to "Code Review"                      |
|   Trigger: PR #341 Merged   ──► Move PM-142 to "QA & Testing", Notify QA          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Authentication & Credential Architecture

### 2.1 GitHub App vs. OAuth App
BeyondPM leverages a **GitHub App** architecture for organizational integration:
- **Granular Permissions:** Read/Write access strictly to `issues`, `pull_requests`, `checks`, `deployments`, `contents` (read), `metadata` (read).
- **Higher Rate Limits:** 5,000 requests/hour per installation (scaling to 12,500 for enterprise orgs).
- **Webhooks:** Automated configuration of repo-level and org-level event subscriptions.

### 2.2 Token Encryption & Secret Management
1. **At-Rest Encryption:** Installation tokens, client secrets, and private keys are encrypted using AES-256-GCM:
   - Cipher algorithm: `aes-256-gcm`.
   - Initialization Vector (IV): 12-byte cryptographically secure random bytes per record.
   - Auth Tag: 16-byte authentication tag ensuring integrity.
2. **Key Rotation:** Master encryption keys are managed via environment variables (`PM_ENCRYPTION_SECRET`).
3. **Zero Frontend Exposure:** GitHub private keys and installation tokens are strictly server-side; the browser never receives GitHub API tokens.

---

## 3. Webhook Ingestion & Pipeline Security

### 3.1 Cryptographic Signature Verification
Every inbound request to `/api/v1/github/webhooks` undergoes HMAC-SHA256 signature verification before JSON parsing:
```javascript
import crypto from 'node:crypto';

export function verifyGitHubSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSignature)
  );
}
```

### 3.2 Idempotency & Deduplication
- Incoming `X-GitHub-Delivery` GUIDs are checked against the `github_events` table.
- If a delivery ID already exists, the server returns `HTTP 200 { status: "already_processed" }` immediately, preventing duplicate side-effects.

---

## 4. Entity Correlation Engine

### 4.1 Regular Expression Pattern Matching
The correlation engine inspects incoming branch names, commit messages, PR titles, and PR descriptions:
$$\text{Regex Pattern:} \quad \mathbf{\backslash b([A-Z]\{2,10\}-\backslash d+)\backslash b}$$

Examples of automatic correlation:
- **Branch Names:**
  - `feature/PM-142-oauth-callback` $\longrightarrow$ correlates `PM-142`
  - `bugfix/CORE-89-connection-timeout` $\longrightarrow$ correlates `CORE-89`
- **Commit Messages:**
  - `git commit -m "PM-142: fix token expiration edge case"` $\longrightarrow$ correlates `PM-142`
  - `git commit -m "refactor(auth): handle PM-142 refresh tokens"` $\longrightarrow$ correlates `PM-142`
- **PR Titles & Bodies:**
  - `[PM-142] Implement Authentication Flow` $\longrightarrow$ correlates `PM-142`
  - `Closes PM-142, relates to PM-145` $\longrightarrow$ correlates `PM-142` and `PM-145`

### 4.2 Multi-Item Correlation
When multiple keys appear in a commit or PR, each referenced work item is correlated.

---

## 5. Development Panel Experience

In the issue detail view, every work item features a real-time **Development Section**:

```
+-----------------------------------------------------------------------------------+
|  DEVELOPMENT                                                                      |
|                                                                                   |
|  Branch:                                                                          |
|    feature/PM-142-auth (3 commits ahead of main)                                  |
|                                                                                   |
|  Pull Request:                                                                    |
|    #341 Implement authentication flow                                             |
|    Status: OPEN                                                                   |
|                                                                                   |
|  Reviews:                                                                         |
|    🟢 2 Approved (@alex-dev, @sarah-lead)  |  🟡 1 Pending (@priya-qa)           |
|                                                                                   |
|  CI / CD Checks:                                                                  |
|    ✓ Build: Passed (42s)                                                          |
|    ✓ Unit Tests: 142/142 Passed (1m 12s)                                          |
|    ✓ Lint & Formatting: Passed                                                    |
|    ✓ Security SAST: 0 Vulnerabilities                                             |
|    ✗ E2E Cypress: 1 Failure (Login timeout)                                       |
|                                                                                   |
|  Deployments:                                                                     |
|    ✓ Staging: Deployed (commit 8a1f2c, 14m ago)                                   |
|    — Production: Not deployed                                                     |
+-----------------------------------------------------------------------------------+
```

---

## 6. Bi-Directional Synchronization & Loop Prevention

### 6.1 Conflict-Free Two-Way Sync
When a change occurs in BeyondPM (e.g. status moved to "Done"), BeyondPM pushes an update to GitHub (e.g., closing the GitHub issue). When an event occurs in GitHub (e.g., an issue is closed), GitHub sends a webhook to BeyondPM.

### 6.2 Circular Sync Loop Prevention
1. **Origin Tracking:** Every mutation includes an `origin` header:
   - When BeyondPM mutates GitHub, it appends a hidden marker in the API payload: `<!-- beyondpm-origin:sync-req-uuid -->`.
2. **Echo Suppression:** When BeyondPM's webhook parser receives an incoming event containing its own recent request tag, it updates the local reference timestamp and suppresses firing automation rules.

---

## 7. GitHub Project Import Wizard

For teams migrating existing GitHub repositories into BeyondPM:
1. **Repository Selector:** Admin chooses organization and repository.
2. **Field & Type Mapping UI:**
   - GitHub label `bug` $\longrightarrow$ Work Item Type `Bug`
   - GitHub label `epic` $\longrightarrow$ Work Item Type `Epic`
   - GitHub label `p0-critical` $\longrightarrow$ Priority `Critical`
   - GitHub milestone `Sprint 12` $\longrightarrow$ Sprint `Sprint 12`
3. **Idempotent Import:** Existing issues matching `github_issue_number` are updated without duplicating records.
