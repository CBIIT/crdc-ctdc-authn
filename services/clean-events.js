const mySQLOps = require("../services/mySQL/mySQL-operations.js");


class CleaningService {

    constructor(tokenSecret,userService) {
        this.tokenSecret = tokenSecret;
        this.userService = userService;
    }
}


async function checkTokenAndClean(req,res) {
        const sessionID = getSessionIDFromCookie(req, res);
        let response = ""
        if (sessionID !== null){
                
                let responseFromPromise = mySQLOps.compareSessionID(sessionID);
                let sessionIDFromTable = await responseFromPromise;
                if (sessionIDFromTable == sessionID){
                    await mySQLOps.clearEventsBeforeTimestamp();
                    await mySQLOps.getCreateCommand("System","Database Cleaning","System","System");
                    console.log("Database Wiped successfully");
                        response = "Database Wiped successfully";
                        return response
                }
                else{

                    console.log("Session ID does not match");
                    response = "Session ID does not match"
                    return response
                }
        } else{

            console.log("Session ID is Null");
            response = "Session ID is Null"
            return response
        };

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






module.exports = {CleaningService,checkTokenAndClean}
