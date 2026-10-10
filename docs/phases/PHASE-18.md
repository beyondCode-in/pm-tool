# BeyondPM Phase 18: Security Hardening & Tenant Isolation

## 1. Objective
Harden the entire platform against enterprise security threats: cross-tenant data leakage, token exposure, CSRF, XSS, rate-limiting abuse, webhook replay attacks, and input tampering.

## 2. Existing State
The current codebase has no server-side security middleware, rate limiting, token encryption, or CSRF headers. Tokens in development scripts are read directly from local environment variables or CLI flags.

## 3. Required Changes
- Tenant Isolation Enforcement:
  - Repository-level query interceptor ensuring every query is bound to `organization_id`.
  - Automated tests verifying cross-tenant queries return 404 or 403.
- Secret & Token Protection:
  - AES-256-GCM encryption for all GitHub App credentials and webhook secrets stored at rest.
  - Zero token exposure to client-side code: GitHub API calls strictly executed on backend.
- Web Application Security Gates:
  - CORS allowlist restricting requests to authorized domains.
  - Helmet security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - Rate limiting middleware: IP-based and user-based bucket rate limiters (e.g. 120 req/min for API, 10 req/min for auth).
  - Webhook signature verification and replay prevention.
  - Input sanitization via DOMPurify / sanitize-html on all markdown and user text.

## 4. Database Changes
- Add `encrypted_token`, `token_iv`, and `token_auth_tag` columns for all sensitive integration credentials.
- Restrict database user privileges: application user lacks `DROP TABLE` or schema modification rights in production.

## 5. Backend Changes
- Implement Security Middleware:
  - `rateLimiter`: sliding-window rate limiting.
  - `csrfProtection`: double-submit cookie or custom header validation for mutating requests.
  - `tenantSanitizer`: validates active tenant claims against requested resource path.
  - `securityHeaders`: configures HSTS, CSP, and framing restrictions.

## 6. Frontend Changes
- Client-side input sanitization before rendering markdown or user comments.
- Secure session storage: JWTs in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

## 7. API Changes
- Return standard RFC 7807 problem details payloads for security rejections (`HTTP 401`, `HTTP 403`, `HTTP 429`).
- `POST /api/v1/auth/csrf-token` - Provide fresh CSRF token.

## 8. Security Considerations
- Protect against timing attacks during signature verification: use `crypto.timingSafeEqual`.
- Rotate secrets safely: support primary and secondary decryption keys during key rollover.
- Audit logging of security anomalies: failed login attempts, rate limit breaches, and permission denials.

## 9. UX States
- **Loading State:** Standard UI states.
- **Empty State:** Not applicable.
- **Error State:** "Rate limit exceeded. Please wait 45 seconds before trying again."
- **Retry State:** Countdown timer on rate limit dialog.
- **Permission-Denied State:** "Access Denied: You do not have permission to view or modify this resource."

## 10. Edge Cases
- Webhook arrived with valid signature but timestamp older than 300 seconds: reject with HTTP 400 to prevent replay attacks.
- High-frequency API automation triggering rate limit: provide separate elevated rate buckets for registered API keys.
- User session invalidated due to password change or role modification: immediately expire active refresh tokens.

## 11. Tests
- Automated Penetration Tests:
  - XSS injection test: attempt `<script>alert(1)</script>` in ticket title and verify escaped render.
  - SQL injection test: attempt `' OR '1'='1` in search query and verify literal string treatment.
  - Tenant boundary test: verify Tenant A user token cannot query Tenant B project ID.
  - Rate limit test: send 150 requests in 10 seconds and verify HTTP 429 responses trigger.

## 12. Acceptance Criteria
- [ ] Cross-tenant queries are completely blocked at data access layer.
- [ ] All sensitive credentials are encrypted with AES-256-GCM at rest.
- [ ] Rate limiting enforces request thresholds with HTTP 429 responses.
- [ ] Markdown and user inputs are strictly sanitized against XSS.
- [ ] Security headers (CSP, HSTS, X-Frame-Options) present on all HTTP responses.

## 13. Dependencies
Phase 02 (Tenancy), Phase 08 (GitHub Core), Phase 14 (RBAC).

## 14. Risks
- Overly strict CSP headers blocking essential assets (e.g. Google Fonts or WebSocket connections): mitigated by explicitly whitelisting font and wss origins.
