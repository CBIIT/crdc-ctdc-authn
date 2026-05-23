# Clinical and Translational Data Commons AuthN/AuthZ service

## Environmental Variables
Following environmental variables are supported by the current runtime configuration.

## Core
- VERSION: build version string
- DATE: build date string
- IDP: default identity provider when request does not include IDP
- DATABASE_TYPE: active event/session backend type (currently startup path expects MYSQL)
- COOKIE_SECRET: secret used to sign cookies
- SESSION_TIMEOUT: session timeout in seconds (default 30 minutes)
- TOKEN_SECRET: secret used to sign JWT tokens
 
## Testing
- TEST_EMAIL: test email used by test-idp path
 
## MySQL Configuration
- MYSQL_HOST: MySQL host
- MYSQL_PORT: MySQL port
- MYSQL_USER: MySQL username
- MYSQL_PASSWORD: MySQL password
- MYSQL_DATABASE: MySQL database name


## Google Login Configuration
- GOOGLE_CLIENT_ID: Google cloud client id
- GOOGLE_CLIENT_SECRET: Google cloud client secret
- GOOGLE_REDIRECT_URL: redirecting url after successful authentication
 
## NIH Login Configuration
- NIH_CLIENT_ID: NIH login server client id
- NIH_CLIENT_SECRET: NIH login client secret
- NIH_BASE_URL: NIH login server url
- NIH_REDIRECT_URL: redirecting url after successful authentication
- NIH_USERINFO_URL: NIH API address to search user information
- NIH_AUTHORIZE_URL: NIH API address to authenticate for login
- NIH_TOKEN_URL: NIH API address to create token for login
- NIH_LOGOUT_URL: NIH API address to invalidate token for logout
- NIH_SCOPE: space-separated lists of identifiers to specify access privileges
- NIH_PROMPT: to force re-authorization event when a current session is still active

## DCF/Fence Login Configuration
- DCF_CLIENT_ID: DCF client id
- DCF_CLIENT_SECRET: DCF client secret
- DCF_BASE_URL: DCF base url
- DCF_REDIRECT_URL: DCF redirect url
- DCF_USERINFO_URL: DCF userinfo endpoint
- DCF_AUTHORIZE_URL: DCF authorize endpoint
- DCF_TOKEN_URL: DCF token endpoint
- DCF_LOGOUT_URL: DCF logout endpoint
- DCF_SCOPE: DCF scope list
- DCF_PROMPT: DCF prompt behavior

## RAS Login Configuration
- RAS_CLIENT_ID: RAS client id
- RAS_CLIENT_SECRET: RAS client secret
- RAS_BASE_URL: RAS base url
- RAS_REDIRECT_URL: RAS redirect url
- RAS_USERINFO_URL: RAS userinfo endpoint
- RAS_AUTHORIZE_URL: RAS authorize endpoint
- RAS_TOKEN_URL: RAS token endpoint
- RAS_LOGOUT_URL: RAS logout endpoint
- RAS_VALIDATE_URL: RAS passport validation endpoint
- RAS_SCOPE: RAS scope list
- RAS_PROMPT: RAS prompt behavior

## Email Configuration
- EMAIL_SMTP_HOST: SMTP host
- EMAIL_SMTP_PORT: SMTP port
- EMAIL_USER: optional SMTP username
- EMAIL_PASSWORD: optional SMTP password

## New Relic Configuration
- NEW_RELIC_APP_NAME: New Relic application name
- NEW_RELIC_LICENSE_KEY: New Relic license key

## Local Development Configuration
- NODE_ENV: If set to "development", a test html page will be activated in the route "/"
- NO_AUTO_LOGIN: If set to "true", local test page will only display authorization codes, instead of calling /login automatically
