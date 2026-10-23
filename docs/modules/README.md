# Modules Index (Bootstrap)

This directory is a scoping guide for module-level deep docs. It intentionally avoids full per-module coverage on first run.

## Current Module Map

| Module Area | Primary Paths | Purpose | Confidence |
|---|---|---|---|
| App bootstrap | `app.js`, `bin/www` | Server startup, middleware, route mounting | Observed |
| Auth route orchestration | `routes/auth.js`, `controllers/auth-api.js` | Endpoint handlers and logout session destroy | Observed |
| IDP abstraction | `idps/index.js`, `idps/*.js` | Provider dispatch and provider-specific login/auth/logout | Observed |
| Session management | `services/session.js` | MySQL-backed Express session store | Observed |
| Token/auth checks | `services/token-service.js`, `services/authenticatation-service.js` | Bearer-token validation helper path | Observed |
| RAS integration | `services/ras-auth.js`, `idps/ras.js` | RAS token exchange, refresh, userinfo, passport validation | Observed |
| User session lookup | `services/user-service.js`, `services/mySQL/mySQL-operations.js` | Retrieve `sessionData.userInfo` for authenticated session | Observed |
| Event logging | `neo4j/event-service.js`, `bento-event-logging/**` | Event write orchestration and event models/constants | Observed |
| Cleanup utilities | `services/clean-events.js` | Session-cookie-based cleanup routine | Observed |
| Operational DB utility | `services/mysql-connection.js` | Session TTL retrieval endpoint support | Observed |

## Deep-Doc Creation Rules

- Create module deep docs only when requested or needed by a change.
- File naming convention: `docs/modules/<module-name>.md`.
- Each deep doc should separate Observed, Inferred, and Unknown sections.

## Candidate Module Docs

- `docs/modules/auth-router.md`
- `docs/modules/idp-dispatch.md`
- `docs/modules/ras-integration.md`
- `docs/modules/mysql-operations.md`

Note: `ras-integration` is a high-priority candidate because RAS passport handling and validation are active runtime behaviors and require operator guidance (env, validation, passport persistence). Create `docs/modules/ras-integration.md` if a deeper trace is requested.
See `docs/system-overview.md` and `docs/architecture/components.md` before writing deep module docs.
