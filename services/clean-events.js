const jwt = require("jsonwebtoken");
const mySQLOps = require("../services/mySQL/mySQL-operations.js");
class CleaningService {

    constructor(tokenSecret,userService) {
        this.tokenSecret = tokenSecret;
        this.userService = userService;
    }



async checkTokenAndClean(req,res) {
        const sessionID = getSessionIDFromCookie(req, res);
        if (sessionID !== null){
                
                let responseFromPromise = mySQLOps.compareSessionID(sessionID);
                let sessionIDFromTable = await responseFromPromise;
                if (sessionIDFromTable == sessionID){
                    await mySQLOps.clearEventsBeforeTimestamp();
                    await mySQLOps.getCreateCommand("System","Database Cleaning","System","System");
                }
                else{
                    console.log("Session ID does not match");
                }
            }
        else {
            console.log("Session ID is null ");
        };
    }
    
}

function getSessionIDFromCookie(req, res){
    if (!req || !req.cookies ){
        res.json({ttl: 0});
        return null;
    }
    else{
        return req.cookies["connect.sid"].match(':.*[.]')[0].slice(1,-1);
    }
}






module.exports = {
    CleaningService
}
