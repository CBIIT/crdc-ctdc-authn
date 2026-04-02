# Runtime Flows & Request Processing

## Top-Level Flow Categories

```mermaid
graph TB
    Request["Incoming Request"]
    
    Request -->|POST /login| LoginFlow["Login Flow"]
    Request -->|POST /logout| LogoutFlow["Logout Flow"]
    Request -->|POST /authenticated| AuthCheckFlow["Auth Check Flow"]
    Request -->|POST /cleanUp| CleanupFlow["Cleanup Flow"]
    Request -->|GET /ping or /version| HealthFlow["Health Check"]
    
    LoginFlow --> L1["1. Exchange auth code with IDP<br/>2. Retrieve user profile<br/>3. Create JWT token<br/>4. Store session<br/>5. Log login event"]
    
    LogoutFlow --> L2["1. Notify IDP for logout<br/>2. Destroy session<br/>3. Log logout event"]
    
    AuthCheckFlow --> L3["1. Check session tokens exist<br/>2. Return auth status"]
    
    CleanupFlow --> L4["1. Verify JWT signature<br/>2. Validate token expiry<br/>3. Clean up stale sessions"]
    
    HealthFlow --> L5["1. Return pong or version"]
```

## 1. Login Flow

**Endpoint**: `POST /api/auth/login`  
**Input**: `{ code: string, IDP: string, redirectUri: string }`  
**Output**: `{ name, email, timeout }`

```mermaid
sequenceDiagram
    actor Client
    participant AuthServer as Auth Server
    participant IDP as IDP Client<br/>(Google/NIH/DCF)
    participant IDPServer as IDP Server
    participant MySQL as MySQL DB
    participant Neo4j as Neo4j DB
    
    Client->>AuthServer: POST /login<br/>(authCode, IDP, redirectUri)
    
    AuthServer->>IDP: login(code, redirectUri)
    IDP->>IDPServer: Exchange code for tokens<br/>(OAuth token endpoint)
    IDPServer-->>IDP: Access token, ID token, user info
    IDP->>IDPServer: Fetch user profile<br/>(userinfo endpoint)
    IDPServer-->>IDP: { name, email, ... }
    IDP-->>AuthServer: { name, lastName, tokens, email, idp }
    
    AuthServer->>MySQL: Store session<br/>{ email, IDP, tokens, name }
    MySQL-->>AuthServer: Session ID
    
    AuthServer->>Neo4j: Log LoginEvent<br/>{ timestamp, email, IDP, event_type }
    Neo4j-->>AuthServer: OK
    
    AuthServer-->>Client: { name, email, timeout }
    
    Note over Client: Client stores token in Authorization header
```

**Code Path**:  
1. [routes/auth.js — POST /login handler](../../routes/auth.js#L52-L83)  
2. [idps/index.js — oauth2Client.login()](../../idps/index.js#L7-L19)  
3. [idps/google.js or idps/nih.js — login() implementation](../../idps/)  
4. [services/session.js — express-session middleware](../../services/session.js)  
5. [neo4j/event-service.js — storeLoginEvent()](../../neo4j/event-service.js)

---

## 2. Logout Flow

**Endpoint**: `POST /api/auth/logout`  
**Input**: `{ IDP: string }`  
**Output**: `{ status: 'success' }`

```mermaid
sequenceDiagram
    actor Client
    participant AuthServer as Auth Server
    participant IDP as IDP Client
    participant IDPServer as IDP Server
    participant MySQL as MySQL DB
    participant Neo4j as Neo4j DB
    
    Client->>AuthServer: POST /logout<br/>{ IDP }
    
    AuthServer->>IDP: logout(idp, tokens)
    alt IDP is NIH or Login.gov
        IDP->>IDPServer: Revoke tokens
        IDPServer-->>IDP: OK / Revoked
    end
    IDP-->>AuthServer: Logout complete
    
    AuthServer->>Neo4j: Log LogoutEvent<br/>{ email, IDP, timestamp }
    Neo4j-->>AuthServer: OK
    
    AuthServer->>MySQL: Destroy session
    MySQL-->>AuthServer: Session destroyed
    
    AuthServer-->>Client: { status: 'success' }
```

**Code Path**:  
1. [routes/auth.js — POST /logout handler](../../routes/auth.js#L86-L107)  
2. [idps/index.js — oauth2Client.logout()](../../idps/index.js#L32-L37)  
3. [idps/nih.js — logout() implementation](../../idps/nih.js)  
4. [controllers/auth-api.js — logout() session destroy](../../controllers/auth-api.js#L1-L10)

---

## 3. Authentication Check Flow

**Endpoint**: `POST /api/auth/authenticated`  
**Input**: (session required)  
**Output**: `{ status: true | false }`

```mermaid
sequenceDiagram
    actor Client
    participant AuthServer as Auth Server
    participant SessionStore as Express-Session<br/>(MySQL)
    
    Client->>AuthServer: POST /authenticated<br/>(with session cookie)
    
    AuthServer->>SessionStore: Retrieve session
    SessionStore-->>AuthServer: Session data or null
    
    alt Session exists and tokens present
        AuthServer-->>Client: { status: true }
    else
        AuthServer-->>Client: { status: false }
    end
    
    Note over SessionStore,AuthServer: Session TTL is refreshed on each request
```

**Code Path**:  
1. [routes/auth.js — POST /authenticated handler](../../routes/auth.js#L110-L120)  
2. Session middleware: [services/session.js](../../services/session.js)

---

## 4. Cleanup Flow

**Endpoint**: `POST /api/auth/cleanUp`  
**Input**: (Authorization header with JWT token optional)  
**Output**: `{ status: true | false }`

```mermaid
sequenceDiagram
    participant Client
    participant AuthServer as Auth Server
    participant TokenService as TokenService
    participant UserService as UserService
    participant MySQL as MySQL DB
    
    Client->>AuthServer: POST /cleanUp<br/>(Bearer token in Authorization header)
    
    AuthServer->>TokenService: authenticateUserToken(token)
    TokenService->>TokenService: Verify JWT signature
    
    alt Signature valid
        TokenService->>TokenService: Decode token payload
        TokenService->>UserService: getUserTokenUUIDs(userInfo)
        UserService->>MySQL: Query user tokens
        MySQL-->>UserService: [token_uuids...]
        UserService-->>TokenService: UUIDs array
        
        alt Token UUID in valid UUIDs list
            TokenService-->>AuthServer: true
            AuthServer-->>Client: { status: true }
        else
            TokenService-->>AuthServer: false
            AuthServer-->>Client: { status: false }
        end
    else Signature invalid
        TokenService-->>AuthServer: false
        AuthServer-->>Client: { status: false }
    end
```

**Code Path**:  
1. [routes/auth.js — POST /cleanUp handler](../../routes/auth.js#L122-L130)  
2. [services/clean-events.js — checkTokenAndClean()](../../services/clean-events.js)  
3. [services/token-service.js — TokenService.authenticateUserToken()](../../services/token-service.js#L8-L14)

---

## 5. Health Check Flow

**Endpoint**: `GET /api/auth/ping` and `GET /api/auth/version`  
**Purpose**: Lightweight readiness/health checks for load balancers and orchestrators

```mermaid
sequenceDiagram
    participant LB as Load Balancer
    participant AuthServer as Auth Server
    
    LB->>AuthServer: GET /ping
    AuthServer-->>LB: 200 "pong"
    
    LB->>AuthServer: GET /version
    AuthServer-->>LB: 200 { version, date }
```

**Code Path**:  
1. [app.js — GET /ping handler](../../app.js#L40-L43)  
2. [app.js — GET /version handler](../../app.js#L45-L50)

---

## Cross-Cutting Concerns

### Session Management

- **Technology**: `express-session` + `express-mysql-session` store  
- **Behavior**: HTTP-only session cookies; server-side store in MySQL  
- **TTL**: Configurable via `SESSION_TIMEOUT` env var (default 30 min)  
- **Refresh**: Session expiry is reset on every request  
- **Code**: [services/session.js](../../services/session.js)

### Token Validation Strategy

**Two methods** depending on context:

| Method | Use Case | Code |
|--------|----------|------|
| **Session Token** | Intra-service requests | Check `req.session.tokens` |
| **JWT Bearer Token** | Cross-service/API calls | Parse `Authorization: Bearer <jwt>` header; verify signature |

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
- **Storage**: MySQL or Neo4j (configurable at startup)

---

## Known Gaps & Uncertainties

| Unknown | Impact | Status |
|---------|--------|--------|
| DCF client implementation | May have special error handling | Not inspected |
| Event format for REVIEW/DOWNLOAD events | Audit logging accuracy | Deferred to feature docs |
| IDP token refresh strategy | Session extension mechanics | Not yet confirmed |
| MySQL vs Neo4j perf characteristics | Deployment decisions | Needs load test |

---

Next: [Modules README](../modules/README.md) for per-module detail.
