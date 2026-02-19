const express = require("express");
const router = express.Router();
const idpClient = require("../idps");
const config = require("../config");
const { logout } = require("../controllers/auth-api");
const {
  formatVariables,
  formatMap,
} = require("../bento-event-logging/const/format-constants");
const { TokenService } = require("../services/token-service");
const {
  AuthenticationService,
} = require("../services/authenticatation-service");
const { EventService } = require("../neo4j/event-service");
const { Neo4jDriver } = require("../neo4j/neo4j");
const { Neo4jService } = require("../neo4j/neo4j-service");
const { UserService } = require("../services/user-service");
const { CleaningService } = require("../services/clean-events.js");
const { checkTokenAndClean } = require("../services/clean-events.js");

let eventService = null;
let cleaningService = null;
let userService = null;
let tokenService = null;

if (config.database_type.toUpperCase() == "MYSQL") {
  const connectionParams = {
    userName: config.mysql_user,
    password: config.mysql_password,
    url: config.mysql_host,
    database: config.mysql_database,
  };
  console.log("[auth-router] Database type: MYSQL");
  console.log(
    "[auth-router] mysql_host=",
    config.mysql_host,
    " mysql_database=",
    config.mysql_database,
  );

  try {
    eventService = new EventService(connectionParams);
    cleaningService = new CleaningService(config.token_secret);
    userService = new UserService(connectionParams);
    tokenService = new TokenService(config.token_secret, userService);
    authService = new AuthenticationService(tokenService, userService);
    console.log("[auth-router] All MYSQL services initialized successfully");
  } catch (err) {
    console.error("[auth-router] Failed to initialize MYSQL services:", err);
    throw err;
  }
} else if (config.database_type.toUpperCase() == "NEO4J") {
  console.log("[auth-router] Database type: NEO4J");
  try {
    const neo4j = new Neo4jDriver(
      config.neo4j_uri,
      config.neo4j_user,
      config.neo4j_password,
    );
    const neo4jService = new Neo4jService(neo4j);
    console.log("[auth-router] NEO4J services initialized successfully");
  } catch (err) {
    console.error("[auth-router] Failed to initialize NEO4J services:", err);
    throw err;
  }
} else {
  console.error("[auth-router] Invalid database_type:", config.database_type);
  throw new Error("Invalid database_type: " + config.database_type);
}

/* Login */
/* Granting an authenticated token */
router.post("/login", async function (req, res) {
  const reqId = req.reqId || "no-reqId";

  console.log(
    `[auth][${reqId}] POST /api/auth/login body keys=`,
    Object.keys(req.body || {}),
  );
  console.log(`[auth][${reqId}] IDP provided=`, req.body && req.body["IDP"]);
  console.log(
    `[auth][${reqId}] redirectUri provided=`,
    req.body && req.body["redirectUri"],
  );

  try {
    if (!req.body["code"]) {
      console.error(`[auth][${reqId}] Missing authorization code in request`);
      throw new Error("Authorization code is required");
    }

    const reqIDP = config.getIdpOrDefault(req.body["IDP"]);
    console.log(`[auth][${reqId}] Using IDP:`, reqIDP);

    const { name, lastName, tokens, email, idp } = await idpClient.login(
      req.body["code"],
      reqIDP,
      config.getUrlOrDefault(reqIDP, req.body["redirectUri"]),
    );
    console.log(
      `[auth][${reqId}] idpClient.login successful for email:`,
      email,
      "idp:",
      idp,
    );
    req.session.userInfo = {
      email: email,
      IDP: idp,
      firstName: name,
      lastName: lastName,
      tokens: tokens,
    };
    console.log(
      `[auth][${reqId}] session.userInfo set. hasSession=`,
      !!req.session,
    );

    req.session.userInfo = formatVariables(
      req.session.userInfo,
      ["IDP"],
      formatMap,
    );
    // we do not need userInfo in neo4j
    try {
      if (!req.session?.userInfo || !req.session.userInfo?.firstName) {
        console.error(
          `[auth][${reqId}] Cannot store login event - userInfo missing firstName; userInfo.firstName=`,
          req.session.userInfo?.firstName,
        );
        console.error(
          `[auth][${reqId}] Returning without response - this will cause request timeout`,
        );
        return;
      }
      console.log(
        `[auth][${reqId}] storing login event for user:`,
        req.session.userInfo.email,
      );
      await eventService.storeLoginEvent(
        req.session.userInfo.firstName,
        req.session.userInfo.email,
        req.session.userInfo.IDP,
        config.database_type,
      );
      console.log(`[auth][${reqId}] login event stored successfully`);
    } catch (err) {
      console.error(`[auth][${reqId}] storeLoginEvent error:`, err.message);
      console.error(`[auth][${reqId}] storeLoginEvent error stack:`, err.stack);
    }

    req.session.tokens = tokens;
    res.json({ name, email, timeout: config.session_timeout / 1000 });

    const timeoutSeconds = config.session_timeout / 1000;
    console.log(
      `[auth][${reqId}] responding success timeoutSeconds=`,
      timeoutSeconds,
    );
  } catch (e) {
    console.error(`[auth][${reqId}] login error - message:`, e && e.message);
    console.error(`[auth][${reqId}] login error - name:`, e && e.name);
    console.error(`[auth][${reqId}] login error - stack:`, e && e.stack);
    console.error(
      `[auth][${reqId}] login error - code:`,
      e && (e.code || e.statusCode),
    );

    let statusCode = 500;
    if (e.code && parseInt(e.code)) {
      statusCode = parseInt(e.code);
    } else if (e.statusCode && parseInt(e.statusCode)) {
      statusCode = parseInt(e.statusCode);
    }

    console.error(`[auth][${reqId}] responding with status:`, statusCode);
    res.status(statusCode).json({ error: e.message });
  }
});

/* Logout */
router.post("/logout", async function (req, res, next) {
  const reqId = req.reqId || "no-reqId";
  console.log(
    `[auth][${reqId}] POST /api/auth/logout body keys=`,
    Object.keys(req.body || {}),
  );
  console.log(`[auth][${reqId}] IDP provided:`, req.body["IDP"]);
  console.log(
    `[auth][${reqId}] User email:`,
    req.session?.userInfo?.email || "unknown",
  );

  try {
    const idp = config.getIdpOrDefault(req.body["IDP"]);
    console.log(`[auth][${reqId}] Using IDP:`, idp);

    console.log(`[auth][${reqId}] calling idpClient.logout(...)`);
    await idpClient.logout(idp, req.session.tokens);
    console.log(`[auth][${reqId}] idpClient.logout success`);

    if (!req.session?.userInfo) {
      console.warn(
        `[auth][${reqId}] No userInfo in session, skipping logout event storage`,
      );
      return logout(req, res);
    }

    try {
      console.log(
        `[auth][${reqId}] storing logout event for user:`,
        req.session.userInfo.email,
      );
      await eventService.storeLogoutEvent(
        req.session.userInfo.firstName,
        req.session.userInfo.email,
        req.session.userInfo.IDP,
        config.database_type,
      );
      console.log(`[auth][${reqId}] logout event stored successfully`);
    } catch (err) {
      console.error(
        `[auth][${reqId}] Failed to store logout event:`,
        err.message,
      );
      console.error(
        `[auth][${reqId}] storeLogoutEvent error stack:`,
        err.stack,
      );
    }

    // Remove User Session
    console.log(`[auth][${reqId}] Removing user session`);
    return logout(req, res);
  } catch (e) {
    console.error(`[auth][${reqId}] logout error - message:`, e && e.message);
    console.error(`[auth][${reqId}] logout error - stack:`, e && e.stack);
    res.status(500).json({ errors: e.message || e });
  }
});

/* Authenticated */
// Return {status: true} or {status: false}
//Calling this API will refresh the session
router.post("/authenticated", async function (req, res) {
  const reqId = req.reqId || "no-reqId";
  console.log(`[auth][${reqId}] POST /api/auth/authenticated`);

  try {
    const isAuthenticated = Boolean(req?.session?.tokens);
    const userEmail = req?.session?.userInfo?.email || "unknown";
    console.log(
      `[auth][${reqId}] Authentication check - status:`,
      isAuthenticated,
      "user:",
      userEmail,
    );
    res.status(200).send({ status: isAuthenticated });
  } catch (e) {
    console.error(
      `[auth][${reqId}] authenticated error - message:`,
      e && e.message,
    );
    console.error(
      `[auth][${reqId}] authenticated error - stack:`,
      e && e.stack,
    );
    res.status(500).json({ errors: e.message || e });
  }
});

router.post("/cleanUp", async function (req, res) {
  const reqId = req.reqId || "no-reqId";
  console.log(`[auth][${reqId}] POST /api/auth/cleanUp`);

  try {
    console.log(`[auth][${reqId}] Starting token cleanup process`);
    let response = await checkTokenAndClean(req, res);
    console.log(`[auth][${reqId}] Cleanup completed - response:`, response);
    res.status(200).send({ status: response });
  } catch (e) {
    console.error(`[auth][${reqId}] cleanUp error - message:`, e && e.message);
    console.error(`[auth][${reqId}] cleanUp error - stack:`, e && e.stack);
    res.status(500).json({ errors: e.message || e });
  }
});

module.exports = router;
