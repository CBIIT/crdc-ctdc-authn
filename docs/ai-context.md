# AI Context for Future Maintenance

Use this file as a reference for understanding the codebase's key decisions, conventions, and gotchas when planning changes or debugging issues.

## Project Identity

- **Name**: CRDC/CTDC Authentication Service (`crdc-ctdc-authn`)
- **Type**: OAuth 2.0 / OIDC broker microservice
- **Language**: Node.js (JavaScript/ES6+) + Express.js
- **Key Domain**: Federated identity management for biomedical research data commons
- **Deployment**: Docker containerized on orchestration platform (Kubernetes, Docker Swarm, etc.)

## Architecture Paradigms

| Paradigm | How It Applies |
|----------|----------------|
| **Microservice** | Standalone auth service decoupled from data commons frontend/backend |
| **Stateless** | No in-memory session state; all sessions persisted to MySQL |
| **Async/Promise-based** | Uses async/await throughout; all IDP calls are async |
| **Factory Pattern** | IDP dispatcher in `idps/index.js` routes to correct OAuth client |
| **Layered Architecture** | Routes → Services → Data Access → External Systems |

## Key Conventions

### Naming & Code Style

- **Filenames**: kebab-case (e.g., `auth-api.js`, `neo4j-operations.js`)
- **Variables/Functions**: camelCase (e.g., `userInfo`, `storeLoginEvent()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GOOGLE`, `LOGIN`)
- **Classes**: PascalCase (e.g., `TokenService`, `AuthenticationService`)
- **Async handlers**: Always include try/catch; return 200 with error details if possible

### Request/Response Conventions

**Success Response**:
```javascript
res.json({ name, email, timeout })        // login
res.json({ status: 'success' })           // logout
res.json({ status: true })                // authenticated
```

**Error Response**:
```javascript
res.status(500).json({ errors: e })       // generic error
res.status(400).json({ error: e.message }) // validation error
```

### Environment Variable Conventions

- Prefix: None (flat namespace)
- Database config: `MYSQL_*`, `NEO4J_*`
- IDP config: `{IDP_NAME}_CLIENT_ID`, etc. (e.g., `GOOGLE_CLIENT_ID`, `NIH_CLIENT_ID`)
- Security: `COOKIE_SECRET`, `TOKEN_SECRET`
- Feature flags: `NO_AUTO_LOGIN`, `NODE_ENV`

## Critical Design Decisions

### 1. Dual Database Support (MySQL + Neo4j)

**Decision**: Support both MySQL and Neo4j via runtime config.  
**Rationale**: Different deployment scenarios; MySQL for speed, Neo4j for audit graph queries.  
**Implication**: Common interface in EventService hides DB choice from routes.

**If you need to add a new event type**:
```javascript
// 1. Create model class in bento-event-logging/model/
// 2. Add store method to EventService
// 3. Call from routes with DATABASE_TYPE check
```

### 2. JWT + Session Hybrid

**Decision**: Issue both JWT tokens and HTTP-only session cookies.  
**Rationale**: Supports both internal calls (session) and cross-service calls (JWT).  
**Implication**: Two independent token validation paths.

**If token validation fails unexpectedly**:
- Check `AuthenticationService.authenticate()` — handles both session and bearer tokens
- Verify `TokenService.verifyToken()` — checks JWT signature
- Ensure `TOKEN_SECRET` env var matches between token creation and verification

### 3. IDP Dispatcher Pattern

**Decision**: Central dispatcher routes to IDP-specific clients.  
**Rationale**: Allows adding new IDPs without modifying routes or core logic.  
**Implication**: New IDP support requires only adding a new entry to `idps/index.js` and creating a new IDP client module.

**If adding a new IDP**:
```javascript
// 1. Create idps/[new-idp].js with login/logout/authenticated functions
// 2. Add case to oauth2Client.login() in idps/index.js
// 3. Add config entries to config.js
// 4. Set env vars for credentials
```

### 4. Event Logging Async-Fire-and-Forget

**Decision**: Log events async without blocking auth response.  
**Rationale**: Prevent login/logout from hanging if event store is slow.  
**Implication**: Event log may lag slightly; not guaranteed for all events.

**If events are missing from logs**:
- Check Neo4j/MySQL connectivity at event store time
- Look for error console logs in event store calls (not returned to client)
- Verify `DATABASE_TYPE` matches your configured database

## Critical Code Paths (Hotspots)

| Path | File | Why It Matters |
|------|------|----------------|
| Login auth exchange | [routes/auth.js#52-83](../../routes/auth.js#L52-L83) | Core revenue path; errors here block user access |
| Token validation | [services/token-service.js#8-14](../../services/token-service.js#L8-L14) | Security-critical; verify JWT logic before changes |
| IDP dispatch | [idps/index.js#7-19](../../idps/index.js#L7-L19) | Router hub; must handle all IDP cases |
| Session store init | [services/session.js](../../services/session.js) | Startup critical; MySQL connection required |
| Event persistence | [neo4j/event-service.js](../../neo4j/event-service.js) | Audit trail; compliance depends on correctness |

## Common Pitfalls

| Pitfall | Symptom | Prevention |
|---------|---------|-----------|
| Case-sensitive IDP names | "IDP not found" errors | Use `isCaseInsensitiveEqual()` utility |
| Stale JWT secret | Tokens verify OK then auth fails | Ensure `TOKEN_SECRET` matches across deployments |
| Missing env var | `undefined` in config object | Check [README.md](../../README.md) for required vars |
| MySQL session pool exhausted | Timeouts on login | Monitor connection pool; increase MySQL max_connections |
| Neo4j event write failures | Silent errors in console | Check Neo4j network access; verify credentials |
| IDP timeout | Login hangs | IDP clients should set reasonable HTTP timeouts |

## Performance Considerations

| Concern | Current Approach | Optimization Opportunity |
|---------|------------------|-------------------------|
| Session lookup | MySQL per-request | Consider session cache layer (Redis) |
| Token verification | Crypto per token | Token caching for repeated verification? |
| Event logging | Async write | Batch events if volume grows? |
| IDP latency | Synchronous wait | Parallel IDP calls (not currently applicable) |

## Testing Surface Area

- **Unit**: Service layer (TokenService, UserService, AuthenticationService)
- **Integration**: Route handlers + mocked IDPs + test MySQL store
- **E2E**: Full auth flow with real IDP (Google, NIH, DCF test accounts)

Tests located in [test/](../../test/)

## Deployment Checklist

Before deploying changes:

- [ ] All env vars set correctly (see [config.js](../../config.js))
- [ ] DATABASE_TYPE is MySQL or NEO4J (uppercase)
- [ ] MySQL session connection tested
- [ ] Neo4j or event store accessible from pod
- [ ] IDP credentials and redirect URLs match IDP provider settings
- [ ] TOKEN_SECRET and COOKIE_SECRET are strong and unique per environment
- [ ] NODE_ENV set to "production" (disables dev test page)
- [ ] NewRelic agent configured (if monitoring enabled)
- [ ] Health checks (`/ping`, `/version`) respond
- [ ] CORS origins configured for frontend domains

## Refactoring Opportunities (Future)

1. **Extract IDP client interface** → Abstract base class for easier testing
2. **Add request/response logging** → Middleware for debugging auth failures
3. **Consolidate event models** → Reduce boilerplate for new event types
4. **Add metrics exporter** → Prometheus metrics for auth success rates, latencies
5. **Implement token refresh** → Extend session without full re-auth

---

**Last Updated**: Bootstrap generation  
**Maintainer**: AI-assisted code change system  

See [Known Gaps](./known-gaps.md) for open questions and uncertainties.
