# Known Gaps & Uncertainties

This document tracks unresolved questions, incomplete inspections, and areas where the codebase requires further investigation before full understanding or modification.

## Architecture Unknowns

| Question | Impact | Investigation Needed |
|----------|--------|----------------------|
| **Does DCF client behave differently from NIH client?** | Medium | ✅ **RESOLVED**: DCF uses separate service layer (`services/dcf-auth.js`) for token exchange; userinfo validation by calling userinfo endpoint instead of verifying signature. See [dcf-fence-login.md](../features/dcf-fence-login.md). |
| **How is Fence IDP different from NIH?** | Medium | 🔍 **PARTIAL**: DCF and Fence appear to use same code paths; [idps/fence.js](../../idps/fence.js) contains outdated Google OAuth code. Clarification needed on Fence vs DCF separation. |
| **What happens on concurrent login attempts from same user?** | Low | Test race condition on token creation and session store |
| **Are IDP tokens ever refreshed mid-session?** | Medium | Not observed in [idps/*.js](../../idps/); may be missing feature |
| **What's the Neo4j event query performance at scale?** | High | No indexes observed; query performance unknown for large datasets |

## Code Inspection Gaps

| File/Component | Status | Next Steps |
|---|---|---|
| [idps/dcf.js](../../idps/dcf.js) | ✅ Inspected | Full implementation documented in [docs/features/dcf-fence-login.md](../features/dcf-fence-login.md) |
| [idps/fence.js](../../idps/fence.js) | 🔍 Partial | File contains Google OAuth code (likely copy-paste error or outdated); needs clarification |
| [services/nih-auth.js](../../services/nih-auth.js) | Not inspected | May contain NIH-specific logic separate from idps/nih.js |
| [services/dcf-auth.js](../../services/dcf-auth.js) | ✅ Inspected | Full implementation documented; see [getDCFToken()](../../services/dcf-auth.js#L7-L26), [dcfUserInfo()](../../services/dcf-auth.js#L41-L50), [dcfLogout()](../../services/dcf-auth.js#L28-L40) |
| [services/notify.js](../../services/notify.js) | Not inspected | Email notification logic; purpose unclear |
| [bento-event-logging/model/*.js](../../bento-event-logging/model/) | Partial | Review ReviewEvent, DownloadEvent, UpdateEvent, etc. |
| [test/services/token-service.test.js](../../test/services/token-service.test.js) | Not inspected | May reveal edge cases in token logic |

## Database/Storage Unknowns

| Question | Impact | Status |
|----------|--------|--------|
| **What happens if MySQL session store goes down?** | Critical | Unknown error handling; likely drops to no session |
| **Neo4j event schema — are there indexes?** | Medium | Not observed; query performance unknown |
| **Do session records in MySQL have TTL/cleanup?** | Medium | `express-mysql-session` handles via `checkExpirationInterval` |
| **How are failed login events tracked?** | Low | Not observed in current code; may be missing |
| **Is there a user table, or only implicit from events?** | Medium | User data appears to come from IDP only; no pre-registration observed |

## IDP Integration Unknowns

| Question | Impact | Status |
|----------|--------|--------|
| **Google OAuth flow — what if user revokes permission?** | Low | Error handling not inspected |
| **NIH logout — what if IDP server is unreachable?** | Medium | May leave stale IDP session |
| **DCF token format** | Low | ✅ **RESOLVED**: Access token only (no ID token). See [dcf-fence-login.md — Data Structures](../features/dcf-fence-login.md#data-structures) |
| **Do IDPs support refresh tokens?** | Medium | ✅ **RESOLVED**: No refresh token support observed in any IDP client; users must re-authenticate when access token expires |
| **What's the timeout for OAuth exchange?** | High | 🔴 **CRITICAL GAP**: No explicit HTTP timeout found in any IDP client (`dcf-auth.js`, `google.js`, `nih.js`). Requests may hang indefinitely. See [dcf-fence-login.md — Known Limitations](../features/dcf-fence-login.md#known-limitations--gaps) |

## Feature Completeness Unknowns

| Feature | Observability | Questions |
|---------|---|--|
| **Logout SLO (Single Logout)** | Low | Only local session destroyed; SLO to other services unknown |
| **Token revocation** | Unknown | Is there an endpoint to invalidate a token before expiry? |
| **Session conflict handling** | Unknown | How are multiple sessions from same user handled? |
| **User role/permission sync** | Unknown | Auth service only; RBAC handled downstream? |
| **Account linking** | Unknown | Can one user have multiple IDP accounts linked? |

## Test Coverage Unknowns

| Suite | Files | Coverage Status |
|-------|-------|---------------|
| Unit tests | [test/services/*.test.js](../../test/services/) | Exists; not inspected for depth |
| Integration tests | [test/auth.test.js](../../test/auth.test.js) | Exists; IDP mocking approach unknown |
| E2E tests | Not found | Are there separate E2E test suites? |
| Load tests | Not found | No load testing configuration observed |

## Performance Unknowns

| Metric | Status | Investigation Needed |
|--------|--------|---------------------|
| Login latency P95 | Unknown | Profile IDP exchange + session store write time |
| Token verification latency | Unknown | Profile JWT crypto vs session lookup |
| Concurrent user capacity | Unknown | Load test with MySQL session store limits |
| Neo4j event write throughput | Unknown | Benchmark event persistence speed |
| Memory footprint | Unknown | Profile Node.js memory usage over time |

## Security Unknowns

| Concern | Status | Investigation Needed |
|---------|--------|---------------------|
| **CSRF token validation** | Unknown | Are CSRF tokens used on forms? Not observed. |
| **XSS prevention** | Unknown | How are user inputs sanitized? |
| **Rate limiting** | Unknown | No rate limit middleware observed on auth endpoints |
| **SQL injection** | Unknown | Are queries parameterized? Check MySQL operations |
| **JWT algorithm** | Unknown | Inspect jwt.verify options; may default to unsafe algorithms |
| **IDP credential storage** | Unknown | Are secrets stored in code or only from env vars? |
| **Session fixation** | Unknown | New session ID on login? |

## Documentation Opportunities

- [ ] Create [docs/features/login.md](./features/login.md) — detailed login flow
- [ ] Create [docs/features/logout.md](./features/logout.md) — logout flow details
- [ ] Create [docs/modules/token-service.md](./modules/token-service.md) — TokenService implementation guide
- [ ] Create [docs/modules/event-service.md](./modules/event-service.md) — Event storage design
- [ ] Document IDP-specific quirks (Google vs NIH vs DCF)
- [ ] Create deployment runbook (env var checklist, MySQL/Neo4j setup)
- [ ] Add troubleshooting guide for common failures

## Changelog: What Changed to Find Gaps?

- Initial bootstrap generation: Inspected core components (app.js, routes, services, IDP dispatcher)
- Session layer: Reviewed session.js and noted MySQL store
- Event logging: Traced EventService to Neo4j and MySQL implementations
- **DCF/Fence deep-dive** (new): Full inspection of dcf-auth.js, idps/dcf.js, idps/fence.js; created [docs/features/dcf-fence-login.md](../features/dcf-fence-login.md)
- **Not yet inspected**: NIH client details, notification service, advanced event types, test suites, performance characteristics

---

## How to Resolve These Gaps

1. **Code Review Task**: Pick a "Not inspected" file from the table above, read it, and update this doc
2. **Test Coverage Task**: Run test suite and inspect coverage report
3. **Load Test**: Simulate realistic auth throughput and measure latency
4. **Security Audit**: Review IDP credential handling, CSRF/XSS, SQL injection risks
5. **Performance Profile**: Benchmark token validation, event logging, IDP round-trips

---

**Last Updated**: Bootstrap generation  
**Strategy**: Prioritize hot-path unknowns (token validation, login latency) before addressing low-impact gaps.
