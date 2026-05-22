# Known Gaps And Contradictions (Bootstrap)

## Code-Backed Gaps

1. **Observed**: MySQL operations export shape appears inconsistent with usage.
- Evidence: `services/mySQL/mySQL-operations.js` exports `{ mySQLOps }`, while multiple files import it as if methods are top-level (`mySQLOps.getSessionTokens`, `mySQLOps.compareSessionID`, etc.).
- Impact: Runtime `TypeError` risk if import/export assumptions diverge outside mocked tests.
- Open question: Should callers use `const { mySQLOps } = require(...)` or should module export the object directly?

2. **Observed**: IDP authenticated check may use inconsistent session property casing.
- Evidence: Login stores `req.session.userInfo.IDP`, while `idps/index.js` authenticated path checks `userSession.idp`.
- Impact: Provider dispatch in `/authenticated` can fail or return false unexpectedly.
- Open question: Should session userInfo normalize to one canonical key (`IDP` or `idp`) everywhere?

3. **Observed**: Session token retrieval function currently returns only `tokens`, but caller in user service expects `sessionData.userInfo`.
- Evidence: `services/user-service.js#getPassportBySession` reads `sessionData.userInfo`; `services/mySQL/mySQL-operations.js#getSessionTokens` resolves `sessionData.tokens`.
- Impact: Passport retrieval can fail to resolve `email` and `IDP`.
- Open question: Should `getSessionTokens` return full session data instead of tokens only?

4. **Observed**: Cleanup logic uses direct cookie parsing assumptions.
- Evidence: `services/clean-events.js#getSessionIDFromCookie` expects `connect.sid` regex shape and writes response inside helper.
- Impact: Fragility and mixed responsibilities in utility method.
- Open question: Should cookie/session extraction be centralized and made defensive?

## Documentation Gaps

1. **Observed**: Existing docs previously described token issuance behavior not directly backed by current code paths.
- Status: Partially corrected in bootstrap docs.

2. **Unknown**: Full DCF/Fence runtime behavior, including retries/error mapping, was not deep-traced in this pass.

3. **Unknown**: Production deployment topology, reverse proxy setup, and scaling semantics are not documented in repository code.

## Verification Gaps

1. **Observed**: Historical test caveat indicates Node v25 compatibility issue through dependency chain (`jwa` -> `buffer-equal-constant-time`) before tests execute.
- Source: repository memory note.
- Open question: What Node version is the supported CI/runtime baseline for this service?
