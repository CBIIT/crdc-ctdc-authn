# CRDC CTDC AuthN Service

Authentication and session service for CTDC applications. This repository provides OAuth-based login/logout/auth-check endpoints across multiple identity providers (Google, NIH/Login.gov, DCF/Fence, RAS), with server-side session management in MySQL.

## What This Service Does

- Handles login via provider-specific auth code exchange
- Persists server-side sessions in MySQL
- Provides auth status and user-info endpoints for clients
- Records login/logout events in the current MySQL runtime path
- Exposes operational endpoints for health, version, and session TTL

## Main Runtime Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/authenticated`
- `GET /api/auth/userInfo`
- `POST /api/auth/cleanUp`
- `GET /api/auth/ping`
- `GET /api/auth/version`
- `GET /api/auth/session-ttl`

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create local env file

```bash
cp .env-template .env
```

3. Fill required values in `.env` (at minimum: MySQL connection + cookie/token secrets + provider values you will use)

4. Start the service

```bash
npm start
```

5. Verify health

```bash
curl http://localhost:3000/api/auth/ping
```

## Development Notes

- Runtime currently expects `DATABASE_TYPE=MYSQL`.
- Session storage is configured through `express-session` + `express-mysql-session`.
- `NODE_ENV=development` enables the local index page at `/`.

## Testing

Run a focused auth route test:

```bash
npx jest test/auth.test.js --runInBand
```

Run all tests:

```bash
npx jest
```

## Troubleshooting

- MySQL auth errors (`ER_NOT_SUPPORTED_AUTH_MODE`): verify DB user/plugin compatibility and local credentials.
- Session or DB warnings: confirm `MYSQL_*` values in `.env` and that the target DB is reachable.
- Missing provider behavior: verify provider-specific env variables are set for the IDP you are testing.

## Environment Variables

The following variables are supported by current runtime configuration.

### Core

- `VERSION`: build version string
- `DATE`: build date string
- `IDP`: default identity provider when request does not include IDP
- `DATABASE_TYPE`: active backend type (current startup path expects `MYSQL`)
- `COOKIE_SECRET`: secret used to sign cookies
- `SESSION_TIMEOUT`: session timeout in seconds (default 30 minutes)
- `TOKEN_SECRET`: secret used to sign JWT tokens

### Testing

- `TEST_EMAIL`: test email used by test-idp path

### MySQL Configuration

- `MYSQL_HOST`: MySQL host
- `MYSQL_PORT`: MySQL port
- `MYSQL_USER`: MySQL username
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_DATABASE`: MySQL database name

### Neo4j Configuration

- `NEO4J_URI`: Neo4j connection URI
- `NEO4J_USER`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password

### Google Login Configuration

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`

### NIH Login Configuration

- `NIH_CLIENT_ID`
- `NIH_CLIENT_SECRET`
- `NIH_BASE_URL`
- `NIH_REDIRECT_URL`
- `NIH_USERINFO_URL`
- `NIH_AUTHORIZE_URL`
- `NIH_TOKEN_URL`
- `NIH_LOGOUT_URL`
- `NIH_SCOPE`
- `NIH_PROMPT`

### DCF/Fence Login Configuration

- `DCF_CLIENT_ID`
- `DCF_CLIENT_SECRET`
- `DCF_BASE_URL`
- `DCF_REDIRECT_URL`
- `DCF_USERINFO_URL`
- `DCF_AUTHORIZE_URL`
- `DCF_TOKEN_URL`
- `DCF_LOGOUT_URL`
- `DCF_SCOPE`
- `DCF_PROMPT`

### RAS Login Configuration

- `RAS_CLIENT_ID`
- `RAS_CLIENT_SECRET`
- `RAS_BASE_URL`
- `RAS_REDIRECT_URL`
- `RAS_USERINFO_URL`
- `RAS_AUTHORIZE_URL`
- `RAS_TOKEN_URL`
- `RAS_LOGOUT_URL`
- `RAS_VALIDATE_URL`
- `RAS_SCOPE`

### Email Configuration

- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT`
- `EMAIL_USER` (optional SMTP username)
- `EMAIL_PASSWORD` (optional SMTP password)

### New Relic Configuration

- `NEW_RELIC_APP_NAME`
- `NEW_RELIC_LICENSE_KEY`

### Local Development

- `NODE_ENV`: set to `development` to enable local test page at `/`
- `NO_AUTO_LOGIN`: if `true`, local test page displays auth codes only and does not auto-call login

## Documentation

Architecture and maintenance docs are under [docs](docs).
