const {getUserID, logEvent} = require("../bento-event-logging/neo4j/neo4j-operations");
const {LoginEvent} = require("../bento-event-logging/model/login-event");
const {LogoutEvent} = require("../bento-event-logging/model/logout-event");

class EventService {

    async storeLoginEvent(userID,userEmail, userIDP,databaseType){
        let loginResponse = ""
        if (databaseType.toUpperCase() == "NEO4J"){ //TODO make this toupper
            let userID = await getUserID(this.neo4j, userEmail, userIDP);
            if (userID === undefined){
                userID = 'Not yet registered';
            }
            
            const loginEvent = new LoginEvent(userID, userEmail, userIDP,connectionParams);
            await logEvent(this.neo4j, loginEvent);
            }
        else if (databaseType.toUpperCase() == "MYSQL"){
            console.log("Switch to SQL ");
            let eventType = "Login";
            

            await mySQLOps.getCreateCommand(userID,eventType,userEmail,userIDP);
            console.log("Has completed creating login event")
            loginResponse = 'completed creating login event'
                return loginResponse
       }
       else {
            throw new Error("Invalid database_type")
         }   
       
    }

    async storeLogoutEvent(userID,userEmail, userIDP,databaseType){
        let logoutResponse = ""
        if (databaseType.toUpperCase() == "NEO4J"){
            let userID = await getUserID(this.neo4j, userEmail, userIDP);
            const logoutEvent = new LogoutEvent(userID, userEmail, userIDP);
            await logEvent(this.neo4j, logoutEvent);
        }
        else if (databaseType.toUpperCase() == "MYSQL"){
            let eventType = "Logout"
            console.log("Switch to SQL ");
            if (userID === undefined){
                userID = 'Session expired';
                logoutResponse = 'Session expired'
                return logoutResponse
            }
            await mySQLOps.getCreateCommand(userID,eventType,userEmail,userIDP);
            console.log("Has completed creating logout event")
            logoutResponse = 'completed creating logout event'
            return logoutResponse
        }
        else {
            throw new Error("Invalid database_type")
        }
        const loginEvent = new LoginEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, loginEvent);
    }

    async storeLogoutEvent(userEmail, userIDP){
        let userID = await getUserID(this.neo4j, userEmail, userIDP);
        const logoutEvent = new LogoutEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, logoutEvent);
    }
}

module.exports = {
    EventService
};
