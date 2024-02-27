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
                console.log("response " + sessionIDFromTable)
                if (sessionIDFromTable == sessionID){
                    mySQLOps.clearEventsBeforeTimestamp(timestamp);
                }
                else{
                    console.log("Does not equal ");
                }
                res.json(response);
            }
        else {
            console.log("is null ");
            // res.json({ttl: null, error: "An internal server error occurred, please contact the administrators"});
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
