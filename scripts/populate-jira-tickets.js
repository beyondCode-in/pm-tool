import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Populating GitHub Issues with rich Jira parameters, custom fields, and subtasks...');

const issues = [
  {
    number: 1,
    title: "[BUG]: Fix OAuth refresh token race condition on parallel API requests (PM-142)",
    body: `## 🏷️ Issue Metadata (Jira + GitHub Projects Engine)

| Parameter | Value |
| --- | --- |
| **Issue Key** | \`PM-142\` |
| **Issue Type** | 🐛 \`BUG\` |
| **Parent Epic** | \`PM-100\` (OAuth 2.0 Security Overhaul) |
| **Priority** | 🔴 \`CRITICAL\` |
| **Story Points** | \`5 pts\` |
| **Estimate Hours** | \`12 hrs\` (Logged: \`10 hrs\`) |
| **Risk Level** | ⚠️ \`CRITICAL\` |
| **SLA Status** | ⏱️ \`HEALTHY\` (Response: 15m, Resolution: 4h) |
| **Security Level** | 🔒 \`PROJECT\` |

---

### 📋 Custom Fields & Parameters
- **Affected Version**: \`v2.3.4\`
- **Customer Impact Rating**: ⭐⭐⭐⭐⭐ (5/5)
- **QA Sign-off Received**: \`true\`
- **CVSS Score**: \`7.8\` (High Severity)

---

### 📝 Problem Description & Context
When multiple simultaneous client requests receive \`401 Unauthorized\`, multiple token refreshes trigger concurrently, revoking valid refresh tokens prematurely and disconnecting active sessions.

---

### ☑️ Subtask Checklist (2/3 Completed)
- [x] Write concurrency unit test with 50 parallel requests
- [x] Add distributed Redis mutex locking around token exchange window
- [ ] Run security regression penetration test

---

### 🔗 Linked GitHub Development Artifacts
- **Branch**: \`feature/PM-142-oauth-fix\`
- **Pull Request**: [#4 (Approved ✓)](https://github.com/beyondCode-in/pm-tool/pull/4)
- **CI Status**: \`SUCCESS\`
- **Deployment**: \`STAGING\``
  },
  {
    number: 2,
    title: "[INCIDENT]: Database connection pool starvation during spike load (PM-145)",
    body: `## 🏷️ Issue Metadata (Jira + GitHub Projects Engine)

| Parameter | Value |
| --- | --- |
| **Issue Key** | \`PM-145\` |
| **Issue Type** | 🚨 \`INCIDENT\` |
| **Parent Epic** | \`PM-100\` (OAuth 2.0 Security Overhaul) |
| **Priority** | 🔴 \`CRITICAL\` |
| **Story Points** | \`8 pts\` |
| **Estimate Hours** | \`16 hrs\` (Logged: \`8 hrs\`) |
| **Risk Level** | ⚠️ \`CRITICAL\` |
| **SLA Status** | ⏱️ \`HEALTHY\` (Target Response: 15m) |
| **Security Level** | 🔒 \`PROJECT\` |

---

### 📋 Custom Fields & Parameters
- **Affected Route**: \`/api/issues/search\`
- **Spike Traffic Rate**: 500 requests/sec
- **Connection Max Limit**: 100 connections

---

### 📝 Problem Description & Context
PgBouncer connection pool max capacity reached causing HTTP 500 error cascade on high traffic routes during morning peak load.

---

### ☑️ Subtask Checklist (1/2 Completed)
- [x] Tune PgBouncer pool max connections to 200
- [ ] Add connection leak monitoring alert in Grafana

---

### 🔗 Linked GitHub Development Artifacts
- **Branch**: \`fix/PM-145-db-pool-tuning\`
- **Pull Request**: \`#308 (Open)\`
- **Deployment Stage**: \`NOT_DEPLOYED\``
  },
  {
    number: 3,
    title: "[FEATURE]: Outbox Event Delivery Worker & Recursion Safety (PM-148)",
    body: `## 🏷️ Issue Metadata (Jira + GitHub Projects Engine)

| Parameter | Value |
| --- | --- |
| **Issue Key** | \`PM-148\` |
| **Issue Type** | ⚡ \`FEATURE\` |
| **Parent Epic** | \`PM-100\` (OAuth 2.0 Security Overhaul) |
| **Priority** | 🟠 \`HIGH\` |
| **Story Points** | \`5 pts\` |
| **Estimate Hours** | \`20 hrs\` |
| **Risk Level** | 🟡 \`MEDIUM\` |
| **Security Level** | 🌐 \`PUBLIC\` |

---

### 📋 Custom Fields & Parameters
- **Target Release**: \`v2.4\`
- **Automation Recursion Limit**: \`trigger_depth <= 3\`
- **Idempotency Window**: 60 seconds

---

### 📝 Feature Requirement
Guaranteed outbox pattern event delivery to prevent automation loop cascades across microservices.

---

### ☑️ Subtask Checklist (0/2 Completed)
- [ ] Create Outbox relational schema
- [ ] Add worker queue processor with backoff retry`
  }
];

issues.forEach(iss => {
  console.log(`Updating Issue #${iss.number}...`);
  try {
    const tmpFile = `d:/pro/pm-tool/scripts/tmp_body_${iss.number}.md`;
    fs.writeFileSync(tmpFile, iss.body);
    execSync(`gh issue edit ${iss.number} --title "${iss.title}" --body-file "${tmpFile}" --repo beyondCode-in/pm-tool`);
    fs.unlinkSync(tmpFile);
    console.log(`✓ Issue #${iss.number} updated successfully.`);
  } catch (err) {
    console.error(`Error updating issue #${iss.number}:`, err.message);
  }
});
