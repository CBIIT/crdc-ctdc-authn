const express = require('express');
const router = express.Router();
const logger = require('../logger');
const { logAuditEvent, logNihCadrFields } = require('../logger');
const idpClient = require('../idps');
const config = require('../config');
const {logout} = require('../controllers/auth-api')
const {formatVariables, formatMap} = require("../bento-event-logging/const/format-constants");
const {EventService} = require("../neo4j/event-service");
const {UserService} = require("../services/user-service");
const { checkTokenAndClean } = require("../services/clean-events.js")
const { mySQLOps } = require("../services/mySQL/mySQL-operations.js");

let eventService = null;
let userService = null;

if (config.database_type.toUpperCase() == 'MYSQL') {
    
    const connectionParams = {
            userName: config.mysql_user,
            password: config.mysql_password,
            url: config.mysql_host,
            database: config.mysql_database
    }

    eventService = new EventService(connectionParams);
    userService = new UserService(mySQLOps);
}
else {
    throw new Error("Invalid database_type")
}

/* Login */
/* Granting an authenticated token */
router.post('/login', async function (req, res) {
    logger.debug(`[${req.method}] ${req.path} - Login attempt with IDP: ${req.body['IDP']}`);
    try {
        logger.info('Processing login request');
        const reqIDP = config.getIdpOrDefault(req.body['IDP']);
        const { name = '', lastName = '', tokens = null, email = '', idp = '', userInfo = null} = await idpClient.login(req.body['code'], reqIDP, config.getUrlOrDefault(reqIDP, req.body['redirectUri'])) || {};
        req.session.userInfo = {
            email: email,
            IDP: idp,
            firstName: name,
            lastName: lastName,
            tokens: tokens,
            userInfo: userInfo
        };
        req.session.userInfo = formatVariables(req.session.userInfo, ["IDP"], formatMap);
       

        
        try{
            if (!req.session?.userInfo || !req.session.userInfo?.firstName){
                logger.warn("Login: userInfo missing or firstName not set"); 
            }
            // Extract NIH CADR fields from IDP userInfo payload for audit logging
            const nihFields = {
                user_name: `${name} ${lastName}`.trim() || undefined,
                transaction_number: userInfo?.txn || undefined,
                user_org: userInfo?.organization || userInfo?.affiliated_institution || undefined,
                eRA_commons_id: userInfo?.eRA_commons_id || userInfo?.era_commons_id || undefined,
                user_permission_group: userInfo?.user_permission_group || undefined,
                user_country_name: userInfo?.country || undefined,
            };

            logNihCadrFields('Authentication', { req, userInfo, idp, statusCode: 200 });

            await eventService.storeLoginEvent(req.session.userInfo.firstName,req.session.userInfo.email,req.session.userInfo.IDP,config.database_type);
         
            logger.info('Outcome of the action (e.g., HTTP status code)   ', '200');
            
        }   
        catch (err){
            logger.error(`Failed to store login event: ${err.message}`);
            logger.info('Outcome of the action (e.g., HTTP status code)   ', '500');
        }

        req.session.tokens = tokens;
        res.json({name, email, "timeout": config.session_timeout / 1000});
    } catch (e) {
        const statusCode = e.code && parseInt(e.code) ? parseInt(e.code) : (e.statusCode && parseInt(e.statusCode) ? parseInt(e.statusCode) : 500);
        logNihCadrFields('Authentication', { req, statusCode });
        res.status(statusCode);
        res.json({error: e.message});
    }
});

/* Logout */
router.post('/logout', async function (req, res, next) {
    logger.debug(`[${req.method}] ${req.path} - Logout attempt with IDP: ${req.body['IDP']}`);
    try {
        logger.info('Processing logout request');
        const idp = config.getIdpOrDefault(req.body['IDP']);
        await idpClient.logout(idp, req.session.tokens);
        if (!req.session?.userInfo){
            logger.warn("Logout: userInfo not found in session"); 
            return logout(req, res);
        }
            const userInfo = req.session.userInfo.userInfo;
            logNihCadrFields('Logout', { req, userInfo, idp, statusCode: 200 });

        await eventService.storeLogoutEvent(req.session.userInfo.firstName,req.session.userInfo.email,req.session.userInfo.IDP,config.database_type);
        // Remove User Session
        return logout(req, res);
         } catch (e) {
            logNihCadrFields('Logout', {
                req,
                userInfo: req.session?.userInfo?.userInfo,
                idp: req.session?.userInfo?.IDP,
                statusCode: 500,
            });
            logAuditEvent('error', 'Logout', { status: 500, message: e.message }, req);
            res.status(500).json({errors: e});
        }
 
});

/* Authenticated */
// Return {status: true} or {status: false}
//Calling this API will refresh the session
router.post('/authenticated', async function (req, res) {
    logger.info(`[${req.method}] ${req.path} - Checking authentication status`);
    try {
        logger.info('Processing authentication check');
        logger.info(`Session data: ${JSON.stringify(req.session)}`);
        if (!req?.session?.userInfo || !req?.session?.tokens) {
            logger.info('Authentication check: false');
            return res.status(200).send({ status : false });
        }

        const authResult = await idpClient.authenticated(req.session.userInfo, req.session.tokens);
        const isAuthenticated = typeof authResult === 'object'
            ? Boolean(authResult.isAuthenticated)
            : Boolean(authResult);

        if (typeof authResult === 'object' && authResult.tokens) {
            req.session.tokens = authResult.tokens;
        }

        if (!isAuthenticated) {
            req.session.tokens = null;
        }

        logger.info(`Authentication check: ${isAuthenticated}`);
        logNihCadrFields('Authenticated', {
            req,
            userInfo: req.session.userInfo?.userInfo,
            idp: req.session.userInfo?.IDP,
            statusCode: 200,
        });
        res.status(200).send({ status : isAuthenticated });
    } catch (e) {
        logger.error(`Authentication check failed: ${e.message}`);
        logNihCadrFields('Authenticated', { req, statusCode: 500 });
        res.status(500).json({errors: e});
    }
});


router.post('/cleanUp', async function (req, res) {
    logger.debug(`[${req.method}] ${req.path} - Cleanup tokens`);
    try {
        logger.info('Processing token cleanup');
        let response = await checkTokenAndClean(req,res);
        logger.info(`Cleanup status: ${response}`);
        res.status(200).send({ status : response });
    } catch (e) {
        logger.error(`Cleanup failed: ${e.message}`);
        res.status(500).json({errors: e});
    }
});

/* Get User Info */
// Returns the authenticated user's stored GA4GH Passport JWT
router.get('/userInfo', async function (req, res) {
    logger.debug(`[${req.method}] ${req.path} - User info retrieval request`);
    try {
        // Extract session ID from Express session
        const sessionId = req.sessionID;
        
        if (!sessionId) {
            logger.info('User info retrieval: session_id not provided');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userInfo = await userService.getUserInfo(sessionId);

        if (!userInfo) {
            logger.debug(`User info retrieval: user info not found for session ${sessionId}`);
            return res.status(404).json({ error: 'User info not found' });
        }

        logger.info(`User info retrieval successful for session: ${sessionId}`);
        logNihCadrFields('UserInfo', { req, userInfo, statusCode: 200 });
        res.status(200).json({ userInfo });
    } catch (error) {
        logger.error(`User info retrieval failed: ${error.message}`);
        logNihCadrFields('UserInfo', { req, statusCode: 500 });
        res.status(500).json({ error: 'Failed to retrieve userInfo' });
    }
});

module.exports = router;
