# Known Gaps And Contradictions (Bootstrap)

## Code-Backed Gaps

1. **Observed**: MySQL operations export shape appears inconsistent with usage.
- Evidence: `services/mySQL/mySQL-operations.js` exports `{ mySQLOps }` and runtime callers currently pass that wrapper object into services (for example in `routes/auth.js`), but historical docs/tests mention top-level method imports.
- Impact: Runtime `TypeError` risk if import/export assumptions diverge outside mocked tests.
- Open question: Should callers use `const { mySQLOps } = require(...)` or should module export the object directly?

2. **Observed**: IDP authenticated check may use inconsistent session property casing.
- Evidence: Login stores `req.session.userInfo.IDP`, while `idps/index.js` authenticated path checks `userSession.idp`.
- Impact: Provider dispatch in `/authenticated` can fail or return false unexpectedly.
- Open question: Should session userInfo normalize to one canonical key (`IDP` or `idp`) everywhere?

3. **Observed**: Passport persistence path is present in service API but not wired in runtime data layer.
- Evidence: `services/user-service.js` defines `persistUserPassportJWT`, while `services/mySQL/mySQL-operations.js` does not currently implement `upsertUserPassportJWT` and `routes/auth.js` does not call the persistence method.
- Impact: `ctdc.user_passports` is not used by current runtime flow.
- Open question: Should passport persistence be implemented now, or should related docs/tests be downgraded to planned work?

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
