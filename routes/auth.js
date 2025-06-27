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
const {Neo4jService} = require("../neo4j/neo4j-service");
const {UserService} = require("../services/user-service");
const {CleaningService} = require("../services/clean-events.js")
const { checkTokenAndClean } = require("../services/clean-events.js")

let eventService = null;
let cleaningService = null;
let userService = null;
let tokenService = null;

if (config.database_type.toUpperCase() == 'MYSQL') {
    
    const connectionParams = {
            userName: config.mysql_user,
            password: config.mysql_password,
            url: config.mysql_host,
            database: config.mysql_database
    }
    console.log('Database type SQL ')
    eventService = new EventService(connectionParams);
    

    cleaningService = new CleaningService(config.token_secret);
    userService = new UserService(connectionParams);
    tokenService = new TokenService(config.token_secret,userService);
    authService = new AuthenticationService(tokenService, userService);
}
else if (config.database_type.toUpperCase() == 'NEO4J'){
    console.log('Database type NEO4J ')
    //services
    const neo4j = new Neo4jDriver(config.neo4j_uri, config.neo4j_user, config.neo4j_password);
    const neo4jService = new Neo4jService(neo4j);


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
            lastName: lastName,
            tokens: tokens
        };
        req.session.userInfo = formatVariables(req.session.userInfo, ["IDP"], formatMap);
        // we do not need userInfo in neo4j
        try{
            if (!req.session?.userInfo || !req.session.userInfo?.firstName){
                console.log("userInfo is " + req.session.userInfo?.firstName) 
                return 
            }
            await eventService.storeLoginEvent(req.session.userInfo.firstName,req.session.userInfo.email,req.session.userInfo.IDP,config.database_type);
            
        }   
        catch (err){
            console.log(err);
        }
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
        if (!req.session?.userInfo){
            console.log("userInfo is " + req.session?.userInfo) 
            return logout(req, res);
        }
        await eventService.storeLogoutEvent(req.session.userInfo.firstName,req.session.userInfo.email,req.session.userInfo.IDP,config.database_type);
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

        res.status(200).send({ status : Boolean(req?.session?.tokens) });
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});

router.post('/cleanUp', async function (req, res) {
    try {
        let response = await checkTokenAndClean(req,res);
        res.status(200).send({ status : response });
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});







module.exports = router;
