# AI Maintenance Context (Bootstrap)

## Repository Identity

- Service type: Node.js Express authentication service for multi-IDP login and session-based auth flows.
- Primary runtime API root: `/api/auth`.
- Startup command: `npm start` -> `node ./bin/www`.

## High-Signal Files For Future Changes

- Entrypoints: `bin/www`, `app.js`
- Route orchestration: `routes/auth.js`
- IDP dispatch and providers: `idps/index.js`, `idps/*.js`
- Session middleware: `services/session.js`
- Token and auth checks: `services/token-service.js`, `services/authenticatation-service.js`
- RAS token and passport flow: `services/ras-auth.js`, `idps/ras.js`
- Data operations: `services/mySQL/mySQL-operations.js`, `services/mysql-connection.js`
- User/session retrieval logic: `services/user-service.js`
- Event writes: `neo4j/event-service.js`, `bento-event-logging/**`

## Runtime Facts (Observed)

- `app.js` mounts auth routes at `/api/auth` and configures CORS, JSON parsing, cookies, logging, and session middleware.
- `routes/auth.js` instantiates route-level services only when `DATABASE_TYPE=MYSQL`; otherwise it throws.
- Session persistence uses `express-mysql-session` with expiration from `SESSION_TIMEOUT`.
- User info retrieval (`GET /api/auth/userInfo`) resolves current session and returns `sessionData.userInfo`.
- Current runtime routes do not include `POST /api/auth/refresh`.

## Conventions And Patterns

- Most behavior is route-centric; business orchestration is concentrated in `routes/auth.js`.
- Config is environment-driven from `config.js`.
- Logging uses `winston` plus HTTP access logs via `morgan`.
- IDP selection is case-insensitive helper based.

## Testing Context

- Test suite exists under `test/**` with API and service tests.
- Known environment caveat is tracked in `docs/known-gaps.md`.

## Confidence Summary

- Observed: Entrypoints, route map, major services, MySQL session/persistence shape.
- Inferred: Intended architecture layering (router -> service -> data) despite some cross-layer coupling.
- Unknown: Full production behavior for every provider-specific edge case.
