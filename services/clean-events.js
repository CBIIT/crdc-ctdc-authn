const { mySQLOps } = require("../services/mySQL/mySQL-operations.js");
const logger = require('winston');


class CleaningService {
    constructor(tokenSecret,userService) {
        this.tokenSecret = tokenSecret;
        this.userService = userService;
    }
}

async function checkTokenAndClean(req,res) {
    const sessionID = getSessionIDFromCookie(req);
    let response = ""
    if (sessionID !== null){
            
            let responseFromPromise = mySQLOps.compareSessionID(sessionID);
            let sessionIDFromTable = await responseFromPromise;
            if (sessionIDFromTable == sessionID){
                await mySQLOps.clearEventsBeforeTimestamp();
                await mySQLOps.getCreateCommand("System","Database Cleaning","System","System");
                logger.info('Database wiped successfully');
                    response = "Database Wiped successfully";
                    return response
            }
            else{
                logger.warn('Cleanup rejected: session ID does not match');
                response = "Session ID does not match"
                return response
            }
    } else{
        logger.warn('Cleanup rejected: session ID is null');
        response = "Session ID is Null"
        return response
    };
}

function getSessionIDFromCookie(req){
    const sessionCookie = req?.cookies?.["connect.sid"];
    if (!sessionCookie){
        logger.warn('Session cookie missing or malformed');
        return null;
    }

    const match = sessionCookie.match(/^s:([^.]*)\./);
    if (!match) {
        logger.warn('Session cookie missing or malformed');
        return null;
    }

    return match[1];
}

module.exports = {CleaningService,checkTokenAndClean}
