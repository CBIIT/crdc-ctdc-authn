# Runtime Flows (Bootstrap Index)

This file is a top-level flow category index for first-run architecture docs. It is not a full step-by-step trace for every feature.

## Top-Level Categories

```mermaid
graph TD
    Inbound["Inbound HTTP"] --> Login["Login\nPOST /api/auth/login"]
    Inbound --> Logout["Logout\nPOST /api/auth/logout"]
    Inbound --> Authn["Authenticated Check\nPOST /api/auth/authenticated"]
    Inbound --> Refresh["RAS Refresh\nPOST /api/auth/refresh"]
    Inbound --> Passport["Passport Retrieval\nGET /api/auth/userInfo"]
    Inbound --> Cleanup["Cleanup\nPOST /api/auth/cleanUp"]
    Inbound --> Ops["Operational\nGET /api/auth/ping|version|session-ttl"]

    Login --> IDP["IDP clients"]
    Refresh --> RAS["services/ras-auth.js"]
    Passport --> User["services/user-service.js"]
    Cleanup --> CleanSvc["services/clean-events.js"]

    User --> SQL[("MySQL")]
    CleanSvc --> SQL
    Login --> SQL
    Ops --> SQL
```

## Flow Category Index

| Category | Entrypoints | Main Runtime Components | Confidence |
|---|---|---|---|
| Login and session creation | `POST /api/auth/login` | `routes/auth.js`, `idps/index.js`, provider clients, `EventService` | Observed |
| Logout and session teardown | `POST /api/auth/logout` | `routes/auth.js`, `controllers/auth-api.js`, IDP logout path | Observed |
| Session-backed auth check | `POST /api/auth/authenticated` | `routes/auth.js`, IDP authenticated call | Observed |
| RAS token lifecycle | `POST /api/auth/refresh` | `routes/auth.js`, `services/ras-auth.js`, MySQL session update | Observed |
| Stored passport lookup | `GET /api/auth/userInfo` | `routes/auth.js`, `services/user-service.js`, MySQL passport lookup | Observed |
| Cleanup and maintenance | `POST /api/auth/cleanUp` | `services/clean-events.js`, MySQL operations | Observed |
| Operational health/metadata | `GET /api/auth/ping`, `GET /api/auth/version`, `GET /api/auth/session-ttl` | `app.js`, `services/mysql-connection.js` | Observed |

## Not Yet Deep-Traced

- **Unknown**: Full per-IDP failure path differences for Google/NIH/DCF/Test under `/authenticated` and `/logout`.
- **Unknown**: Whether all cleanup logic paths are exercised in production.
- **Inferred**: Refresh flow is RAS-specific even though endpoint naming is generic.

## Suggested Next Deep Docs (On Demand)

- `docs/features/login.md`
- `docs/features/logout.md`
- `docs/features/ras-refresh.md`
- `docs/features/passport-retrieval.md`

- Session checks are fast (in-memory after MySQL read)  
- JWT checks require cryptographic verification  
- **Code**: [services/token-service.js](../../services/token-service.js)

### Event Logging

All authentication events are recorded to database:

| Event Type | When | Fields |
|----------|------|--------|
| `LOGIN` | Successful login | email, IDP, firstName, timestamp |
| `LOGOUT` | Successful logout | email, IDP, firstName, timestamp |
| `REVIEW` | User reviews data | (format depends on domain) |
| `DOWNLOAD` | User downloads file | (format depends on domain) |

- **Code**: [bento-event-logging/model/](../../bento-event-logging/model/)  
- **Observed runtime path**: Event writes are handled through [services/mySQL/mySQL-operations.js](../../services/mySQL/mySQL-operations.js) in the current startup path

### RAS Passport Lifecycle

- **Observed**: RAS login may return `passportJWT`, which is written to `ctdc.user_passports`
- **Observed**: `POST /api/auth/refresh` refreshes tokens, fetches updated user info, validates the refreshed passport, and persists it back to MySQL when the session IDP is RAS
- **Observed**: `GET /api/auth/userInfo` returns the raw stored passport JWT for the authenticated session without decoding claims

---

## Known Gaps & Uncertainties

| Unknown | Impact | Status |
|---------|--------|--------|
| DCF client implementation | May have special error handling | Not inspected |
| Event format for REVIEW/DOWNLOAD events | Audit logging accuracy | Deferred to feature docs |
| Non-RAS token refresh strategy | Session extension mechanics for other IDPs | Not yet confirmed |
| MySQL event volume perf characteristics | Deployment decisions | Needs load test |

---

Next: [Modules README](../modules/README.md) for per-module detail.
