# Features Index (Bootstrap)

This is a first-pass feature inventory and scoping guide. Deep feature docs should be generated only when requested.

## Current Feature Inventory

| Feature Category | Endpoints | Purpose | Confidence |
|---|---|---|---|
| Login | `POST /api/auth/login` | Exchange auth code with selected IDP, create session state | Observed |
| Logout | `POST /api/auth/logout` | Notify IDP (when implemented) and destroy server session | Observed |
| Auth check | `POST /api/auth/authenticated` | Verify active session/token validity | Observed |
| RAS refresh | `POST /api/auth/refresh` | Refresh RAS token bundle and persist updated tokens | Observed |
| Passport retrieval | `GET /api/auth/userInfo` | Return stored GA4GH passport JWT for active session user | Observed |
| Cleanup | `POST /api/auth/cleanUp` | Trigger maintenance cleanup logic tied to session cookie | Observed |
| Operational endpoints | `GET /api/auth/ping`, `GET /api/auth/version`, `GET /api/auth/session-ttl` | Health/version/TTL visibility | Observed |

## Existing Scoped Docs

- `docs/features/dcf-fence-login.md`

## Deep-Doc Naming Pattern

- `docs/features/<feature-name>.md`

Examples:

- `docs/features/login.md`
- `docs/features/logout.md`
- `docs/features/ras-refresh.md`
- `docs/features/passport-retrieval.md`

## What To Include In Deep Feature Docs

- Observed request and response shapes from code/tests
- Mermaid sequence diagram for workflow sections
- Error behavior and status-code branches
- Config keys that materially affect behavior
- Unknowns and unresolved assumptions

See `docs/architecture/runtime-flows.md` for category-level navigation.
