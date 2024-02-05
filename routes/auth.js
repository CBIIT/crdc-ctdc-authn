const express = require('express');
const router = express.Router();
const idpClient = require('../idps');
const config = require('../config');
const {logout} = require('../controllers/auth-api')
const {formatVariables, formatMap} = require("../bento-event-logging/const/format-constants");
const {TokenService} = require("../services/token-service");
const {AuthenticationService} = require("../services/authenticatation-service");
const {EventService} = require("../neo4j/event-service");
const {Neo4jDriver} = require("../neo4j/neo4j");
const {mySQLDriver} = require("../neo4j/mySQL.js");
const {Neo4jService} = require("../neo4j/neo4j-service");
const {UserService} = require("../services/user-service");
if (config.database_type = 'MYSQL') {
    console.log('Database type SQL ')
    //services
    const mySQL = new mySQLDriver(config.mysql_host, config.mysql_user, config.mysql_password,config.mysql_port);
        //anything else needed to connect
}
else if (config.database_type = 'NEO4J'){
    console.log('Database type NEO4J ')
    //services
    const neo4j = new Neo4jDriver(config.neo4j_uri, config.neo4j_user, config.neo4j_password);
    const neo4jService = new Neo4jService(neo4j);
    const eventService = new EventService(neo4j);
    const userService = new UserService(neo4jService);
    const tokenService = new TokenService(config.token_secret, userService);
    const authService = new AuthenticationService(tokenService, userService);
}
else {
    throw new Error("Invalid database_type")
}


/* Login */
/* Granting an authenticated token */
router.post('/login', async function (req, res) {
    try {
        const reqIDP = config.getIdpOrDefault(req.body['IDP']);
        const { name, lastName, tokens, email, idp } = await idpClient.login(req.body['code'], reqIDP, config.getUrlOrDefault(reqIDP, req.body['redirectUri']));
        req.session.userInfo = {
            email: email,
            IDP: idp,
            firstName: name,
            lastName: lastName
        };
        req.session.userInfo = formatVariables(req.session.userInfo, ["IDP"], formatMap);
        // we do not need userInfo in neo4j
        await eventService.storeLoginEvent(req.session.userInfo.email, req.session.userInfo.IDP,config.database_type);

        req.session.tokens = tokens;
        res.json({name, email, "timeout": config.session_timeout / 1000});
    } catch (e) {
        if (e.code && parseInt(e.code)) {
            res.status(parseInt(e.code));
        } else if (e.statusCode && parseInt(e.statusCode)) {
            res.status(parseInt(e.statusCode));
        } else {
            res.status(500);
        }
        res.json({error: e.message});
    }
});

/* Logout */
router.post('/logout', async function (req, res, next) {
    try {
        console.log("logout")
         console.log(req.body['IDP'])
        const idp = config.getIdpOrDefault(req.body['IDP']);
        await idpClient.logout(idp, req.session.tokens);
        // we do not need userInfo in neo4j
        // let userInfo = req.session.userInfo;
        await eventService.storeLogoutEvent(userInfo.email, userInfo.IDP);
        // Remove User Session
        return logout(req, res);
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});

/* Authenticated */
// Return {status: true} or {status: false}
//Calling this API will refresh the session
router.post('/authenticated', async function (req, res) {
    try {
        //const status = await authService.authenticate(req);
        //res.status(200).send({ status : Boolean(req?.session?.tokens) });
        res.status(200).send({ status : true });
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});

module.exports = router;
