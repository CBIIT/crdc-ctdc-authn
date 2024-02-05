const {getUserID, logEvent} = require("../bento-event-logging/neo4j/neo4j-operations");
const {LoginEvent} = require("../bento-event-logging/model/login-event");
const {LogoutEvent} = require("../bento-event-logging/model/logout-event");
const {LoginEventSQL} = require("../bento-event-logging/mySQL/LoginEvent.js");
class EventService {







    constructor(databaseConnection) { //rename databse connection
        this.databaseConnection = databaseConnection.connection;
    } 


    async storeLoginEvent(userEmail, userIDP,databaseType){
        if (databaseType = "NEO4J"){
        let userID = await getUserID(this.neo4j, userEmail, userIDP);
        if (userID === undefined){
            userID = 'Not yet registered';
        }
        
        const loginEvent = new LoginEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, loginEvent);
        }
        else if (databaseType = "MYSQL"){// convert to upper case for conparsion 
        console.log("Switch to SQL ");
        let LoginEventSQL = new LoginEventSQL(userID, this.mySQL)
        this.databaseConnector.logEvent(LoginEventSQL);
       }
       else {
        console.log("throw error");
         }   
       
    }

    async storeLogoutEvent(userEmail, userIDP, databaseType){
        if (databaseType = "NEO4J"){
        let userID = await getUserID(this.neo4j, userEmail, userIDP);
        const logoutEvent = new LogoutEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, logoutEvent);
        }
        else if (databaseType = "MYSQL"){
            console.log("Switch to SQL ");
            let LoginEventSQL = new LoginEventSQL(userID, this.mySQL)
            this.databaseConnector.logEvent(LoginEventSQL);
        }
        else {
            console.log("throw error");
        }
    }
}

module.exports = {
    EventService
};
