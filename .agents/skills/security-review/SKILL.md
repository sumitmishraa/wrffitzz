---
name: security-review
description: Comprehensive security audit skill from ECC — validates input sanitization, token validation, secret handling, authentication gates, and OWASP compliance.
---

# Security Review & Audit Guide

Use this skill before deploying to verify:
1. **Secrets & Environment Variables**: No credentials committed to git.
2. **Access Control & Authorization**: Ensure private routes like `/admin` and mutation endpoints have authentication barriers.
3. **Input Sanitization & Injection Prevention**: Parameterized queries, clean file names, safe file extensions.
4. **Error Handling**: Do not leak server stack traces to public callers.
5. **CSRF & Rate Limiting**: Guard state mutations.
