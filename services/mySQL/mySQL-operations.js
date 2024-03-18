const nodeFetch = require('node-fetch');
const mysql = require('mysql');
const config = require('../../config');

const connection = mysql.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    insecureAuth : false,
    multipleStatements: true
});



async function getCreateCommand(userID,eventType,userEmail,userIDP) {
        
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err){console.log("line 18 results " +  err);reject(err);} 
            
            else resolve(connection);
        });
    }); 
        // let sessionID = getSessionIDFromCookie(req, res);
        let sessionID = 1; // Example sessionID
        if (sessionID !== null) {
            const rows = await new Promise((resolve, reject) => {
                currentConnection.query("INSERT INTO ctdc.loginTable (userID,userEmail,userIDP,timestamp) VALUES ('" + userID + "','" + userEmail + "', '" + userIDP + "', TIMESTAMP(NOW())) ON DUPLICATE KEY UPDATE timestamp = TIMESTAMP(NOW()); INSERT INTO ctdc.eventTable (eventID,userID,timestamp,eventType) VALUES (NULL ,'" + userID + "' ,TIMESTAMP(NOW()), '" + eventType + "');", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (!rows || !rows[0] || !rows[0].data) {
                console.log("Create Command Runs");
                return -1; // or handle accordingly
            } else {
                const output = JSON.parse(rows[0].data).userInfo.tokens;
                return output;
            }
        } else {
            console.log("An internal server error occurred, please contact the administrators");
            return -1;
        }
        if (currentConnection) currentConnection.release();
    } catch (error) {
        console.log("Error: ", error.message);
        return -1;
    } finally {
         if (currentConnection) {
            currentConnection.release(); // Ensure connection is released
        }
        
    }
}
// get an array of timestamps after a timestamp 
// use await output to receive output otherwise it will just return a promise object
async function getEventAfterTimestamp(timestamp,eventType) {
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });

    // let sessionID = getSessionIDFromCookie(req, res);
    let sessionID = 1; // Example sessionID
    if (sessionID !== null) {
        const rows = await new Promise((resolve, reject) => {
            currentConnection.query("SELECT * FROM ctdc.eventTable WHERE timestamp > '" + timestamp + "' and eventType = '" + eventType + "' ;", (err, rows) => {
                if (err) reject(err);
                
                else resolve(rows);
            });
        });
        let json_rows =  await rows
        if (!rows || !rows[0]) {
            
            console.log("Session expires");
            
            console.log(rows[0]);
            return -1 // or handle accordingly
        } else {
            const output = json_rows
            return output;

        }
    } else {
        console.log("An internal server error occurred, please contact the administrators");
        return -1;
    }
    if (currentConnection) currentConnection.release();
} catch (error) {
    console.log("Error: ", error.message);
    return -1;
} finally {
     if (currentConnection) {
        currentConnection.release(); // Ensure connection is released
    }
    
}
}

async function clearEventsBeforeTimestamp() {
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });


    // let sessionID = getSessionIDFromCookie(req, res);
    let sessionID = 1; // Example sessionID
    if (sessionID !== null) {
        const rows = await new Promise((resolve, reject) => {
            
            currentConnection.query("DELETE FROM ctdc.eventTable WHERE timestamp < TIMESTAMP(NOW());DELETE FROM ctdc.loginTable WHERE timestamp < TIMESTAMP(NOW())", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0] || !rows[0].data) {
            console.log("Session expires");
            return -1; // or handle accordingly
        } else {
            const output = JSON.parse(rows[0].data).userInfo.tokens;
            return output;
        }
    } else {
        console.log("An internal server error occurred, please contact the administrators");
        return -1;
    }
    if (currentConnection) currentConnection.release();
} catch (error) {
    console.log("Error: ", error.message);
    return -1;
} finally {
     if (currentConnection) {
        currentConnection.release(); // Ensure connection is released
    }
    
}
}

async function compareSessionID(sessionID) {
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });


    // let sessionID = getSessionIDFromCookie(req, res);
    if (sessionID !== null ) {
        const rows = await new Promise((resolve, reject) => {
            currentConnection.query("SELECT session_id FROM ctdc.sessions where session_id = '" + sessionID + "';", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0]) {
            console.log("Session expires");
            return -1; // or handle accordingly
        } else {
            const output = rows[0].session_id
               return output;
        }
    } else {
        console.log("An internal server error occurred, please contact the administrators");
        return -1;
    }
    if (currentConnection) currentConnection.release();
} catch (error) {
    console.log("Error: ", error.message);
    return -1;
} finally {
     if (currentConnection) {
        currentConnection.release(); // Ensure connection is released
    }
    
}
}
async function getLastLogin() {
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });


    // let sessionID = getSessionIDFromCookie(req, res);
    if (currentConnection !== null) {
        const rows = await new Promise((resolve, reject) => {
            currentConnection.query("SELECT * FROM ctdc.eventTable ORDER BY timestamp DESC LIMIT 1;", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0]) {
            console.log("Session expires");
            return -1; // or handle accordingly
        } else {
            const output = rows[0]
               return output;
        }
    } else {
        console.log("An internal server error occurred, please contact the administrators");
        return -1;
    }
    if (currentConnection) currentConnection.release();
} catch (error) {
    console.log("Error: ", error.message);
    return -1;
} finally {
     if (currentConnection) {
        currentConnection.release(); // Ensure connection is released
    }
    
}
}


    




module.exports = {
    getCreateCommand,
    getEventAfterTimestamp,
    compareSessionID,
    getLastLogin,
    // getEventAfterTimestamp,
    clearEventsBeforeTimestamp
    // getEventsAfterTimestamp
}