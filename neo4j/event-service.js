const {getUserID, logEvent} = require("../bento-event-logging/neo4j/neo4j-operations");
const { mySQLOps } = require("../services/mySQL/mySQL-operations.js");
const logger = require('../logger');
class EventService {
    constructor(databaseConnection) { //rename databse connection
        this.databaseConnection = databaseConnection.connection;
    } 

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
            logger.debug('event.store.login route=mysql');
            let eventType = "Login";
            

            await mySQLOps.getCreateCommand(userID,eventType,userEmail,userIDP);
            logger.debug('event.store.login completed');
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
            logger.debug('event.store.logout route=mysql');
            if (userID === undefined){
                userID = 'Session expired';
                logoutResponse = 'Session expired'
                return logoutResponse
            }
            await mySQLOps.getCreateCommand(userID,eventType,userEmail,userIDP);
            logger.debug('event.store.logout completed');
            logoutResponse = 'completed creating logout event'
            return logoutResponse
        }
        else {
            throw new Error("Invalid database_type")
        }
    }
}

module.exports = {
    EventService
};
