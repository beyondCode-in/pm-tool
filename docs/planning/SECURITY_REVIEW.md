# Security Review & Audit Strategy

## Security Guardrails
1. **RBAC & Field-Level Access Control Enforcement**: Evaluated on every API request and state transition.
2. **Webhook Verification**: Webhook secret signature verification for GitHub integrations (`X-Hub-Signature-256`).
3. **Audit Log System**: Immutably records WHO, WHAT, WHEN, OLD VALUE, NEW VALUE, and SOURCE for every issue mutation.
4. **Input Sanitization & Schema Validation**: Strict Zod/DTO parsing across all endpoints.
