# Modules Index

This directory contains detailed documentation for each major application module. Each module doc traces the module's purpose, dependencies, key functions, and class definitions.

## Module Inventory

### Service Layer Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **Token Service** | [services/token-service.js](../../services/token-service.js) | JWT creation, verification, and payload decoding |
| **Authentication Service** | [services/authenticatation-service.js](../../services/authenticatation-service.js) | Bearer token validation and session checking |
| **User Service** | [services/user-service.js](../../services/user-service.js) | User profile and token UUID lookup |
| **Session Service** | [services/session.js](../../services/session.js) | Express-session initialization with MySQL store |
| **Cleaning Service** | [services/clean-events.js](../../services/clean-events.js) | Token validation and stale session cleanup |
| **MySQL Connection** | [services/mysql-connection.js](../../services/mysql-connection.js) | MySQL pool and utility queries |

### IDP Integration Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **IDP Dispatcher** | [idps/index.js](../../idps/index.js) | Routes OAuth requests to correct IDP client |
| **Google OAuth Client** | [idps/google.js](../../idps/google.js) | Google OAuth 2.0 login/logout |
| **NIH OAuth Client** | [idps/nih.js](../../idps/nih.js) | NIH & Login.gov OAuth 2.0 |
| **DCF OAuth Client** | [idps/dcf.js](../../idps/dcf.js) | DCF/Fence OAuth 2.0 |
| **Test IDP** | [idps/testIDP.js](../../idps/testIDP.js) | Mock IDP for local development |

### Data Access Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **Event Service** | [neo4j/event-service.js](../../neo4j/event-service.js) | Stores and queries authentication events |
| **Neo4j Service** | [neo4j/neo4j-service.js](../../neo4j/neo4j-service.js) | High-level Neo4j operations |
| **Neo4j Driver** | [neo4j/neo4j.js](../../neo4j/neo4j.js) | Low-level Neo4j Cypher execution |
| **Neo4j Operations** | [neo4j/neo4j-operations.js](../../neo4j/neo4j-operations.js) | Event log queries and manipulations |
| **MySQL Operations** | [services/mySQL/mySQL-operations.js](../../services/mySQL/mySQL-operations.js) | User and session queries |

### Event Model Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **Event Models** | [bento-event-logging/model/](../../bento-event-logging/model/) | Event class definitions (LoginEvent, LogoutEvent, etc.) |
| **Event Constants** | [bento-event-logging/const/](../../bento-event-logging/const/) | Event types, access control, format mappings |
| **Neo4j Event Driver** | [bento-event-logging/neo4j/neo4j-operations.js](../../bento-event-logging/neo4j/neo4j-operations.js) | Event persistence to Neo4j |

### Route & Controller Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **Auth Routes** | [routes/auth.js](../../routes/auth.js) | HTTP endpoint handlers for login/logout/auth/cleanup |
| **Auth Controllers** | [controllers/auth-api.js](../../controllers/auth-api.js) | Logout handler (session destroy) |

### Utility Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **String Utils** | [util/string-util.js](../../util/string-util.js) | Case-insensitive string comparisons |
| **IDPs Constants** | [constants/idp-constants.js](../../constants/idp-constants.js) | IDP enum constants |

## Module Documentation Files

When detailed module-level analysis is needed, create a doc file using the pattern:

```
docs/modules/[module-name].md
```

Example structure:

```markdown
# [Module Name]

## Purpose
Brief description of what this module does.

## Dependencies
- Internal: [other modules]
- External: [npm packages]

## Key Exports
- Class/Function A: …
- Class/Function B: …

## Usage Example
When and how this module is typically used.

## Data Structures
Schemas of key objects (if applicable).

## Known Issues
Any quirks or gotchas.
```

---

## Quick Reference: Which Module Does What?

**User logs in?** → [Token Service](../../services/token-service.js) creates JWT  
**User's session expires?** → [Session Service](../../services/session.js) + MySQL store  
**Verify user's token?** → [Authentication Service](../../services/authenticatation-service.js)  
**Exchange OAuth code?** → [IDP Dispatcher](../../idps/index.js) → IDP client  
**Record login event?** → [Event Service](../../neo4j/event-service.js)  
**Find user's token UUIDs?** → [User Service](../../services/user-service.js)  

---

See [System Overview](../system-overview.md) for architecture context.
