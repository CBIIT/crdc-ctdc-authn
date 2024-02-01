const {getUserID, logEvent} = require("../bento-event-logging/neo4j/neo4j-operations");
const {LoginEventNeo4j} = require("../bento-event-logging/model/login-event");
const {LogoutEventSQL} = require("./bento-event-logging/mySQL/getLastLogin.js");
const {LoginEventSQL} = require("./bento-event-logging/mySQL/getLastLogin.js");
class EventService {



    constructor(databaseConnection) { //rename databse connection
        if (databaseConnection == 'neo4j'){
        this.databaseConnection = databaseConnection.connection;
        }
        if (databaseConnection == 'mySQL'){
            this.databaseConnection = databaseConnection.connection;
            }
    } 


    async storeLoginEventNeo4j(userEmail, userIDP){


        let userID = await getUserID(this.databaseConnection, userEmail, userIDP);
        if (userID === undefined){
            userID = 'Not yet registered';
        }
        const loginEvent = new LoginEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, loginEvent);
    }

    async storeLogoutEventNeo4j(userEmail, userIDP){
        let userID = await getUserID(this.databaseConnection, userEmail, userIDP);
        const logoutEvent = new LogoutEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, logoutEvent);
    }

    async storeLoginEventSQL(userEmail, userIDP){


        let userID = await getUserID(this.databaseConnection, userEmail, userIDP);
        if (userID === undefined){
            userID = 'Not yet registered';
        }
        const loginEvent = new LoginEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, loginEvent);
    }

    async storeLogoutEventSQL(userEmail, userIDP){
        let userID = await getUserID(this.databaseConnection, userEmail, userIDP);
        const logoutEvent = new LogoutEvent(userID, userEmail, userIDP);
        await logEvent(this.neo4j, logoutEvent);
    }
}

module.exports = {
    EventService
};
