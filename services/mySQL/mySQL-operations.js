const mysql = require('mysql2');
const config = require('../../config');
const logger = require('../../logger');

const connection = mysql.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    insecureAuth : false,
    multipleStatements: true,
    connectTimeout: 60000, // 60 seconds
    acquireTimeout: 60000, // 60 seconds
    timeout: 60000, // 60 seconds
    waitForConnections: true
});



async function getCreateCommand(userID,eventType) {
        
    let currentConnection = null;
    try {
    const currentConnection = await new Promise((resolve, reject) => {
        connection.getConnection((err, connection) => {
            if (err){logger.error(`DB connection error: ${err.message}`);reject(err);} 
            
            else resolve(connection);
        });

    }); 
   
        // let sessionID = getSessionIDFromCookie(req, res);
        let sessionID = 1; // Example sessionID
        if (sessionID !== null) {
            const rows = await new Promise((resolve, reject) => {
                currentConnection.query(" INSERT INTO eventTable (eventID,userID,timestamp,eventType) VALUES (NULL ,'" + userID + "' ,TIMESTAMP(NOW()), '" + eventType + "');", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            if (!rows || !rows[0] || !rows[0].data) {
                logger.debug('Create command executed, no data rows returned');
                currentConnection.release()
                return -1; // or handle accordingly
            } else {
                const output = JSON.parse(rows[0].data).userInfo.tokens;
                currentConnection.release()
                return output;
            }
        } else {
            logger.error('getCreateCommand: session ID is null, internal server error');
            currentConnection.release()
            return -1;
        }
    } catch (error) {
        logger.error(`getCreateCommand error: ${error.message}`);
        currentConnection.release()
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
            currentConnection.query("SELECT * FROM eventTable WHERE timestamp > '" + timestamp + "' and eventType = '" + eventType + "' ;", (err, rows) => {
                if (err) reject(err);
                
                else resolve(rows);
            });
        });
        if (!rows || !rows[0]) {
            logger.debug('getEventAfterTimestamp: no rows found, session may have expired');
            currentConnection.release();
            return -1 // or handle accordingly
        } else {
            const output = rows
            currentConnection.release();
            return output;

        }
    } else {
        logger.error('getEventAfterTimestamp: session ID is null, internal server error');
        currentConnection.release();
        return -1;
    }
} catch (error) {
    logger.error(`getEventAfterTimestamp error: ${error.message}`);
    currentConnection.release();
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
            
            currentConnection.query("DELETE FROM eventTable WHERE timestamp < TIMESTAMP(NOW());", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0] || !rows[0].data) {
            logger.debug('clearEventsBeforeTimestamp: no rows returned');
            currentConnection.release();
            return -1; // or handle accordingly
        } else {
            const output = JSON.parse(rows[0].data).userInfo.tokens;
            currentConnection.release();
            return output;
        }
    } else {
        logger.error('clearEventsBeforeTimestamp: session ID is null, internal server error');
        return -1;
    }
} catch (error) {
    logger.error(`clearEventsBeforeTimestamp error: ${error.message}`);
    currentConnection.release();
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
            currentConnection.query("SELECT session_id FROM sessions where session_id = '" + sessionID + "';", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0]) {
            logger.debug('compareSessionID: session not found or expired');
            currentConnection.release();
            return -1; // or handle accordingly
        } else {
            const output = rows[0].session_id
            currentConnection.release();
               return output;
        }
    } else {
        logger.error('compareSessionID: session ID is null, internal server error');
        return -1;
    }
} catch (error) {
    logger.error(`compareSessionID error: ${error.message}`);
    currentConnection.release();
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
            currentConnection.query("SELECT * FROM eventTable ORDER BY timestamp DESC LIMIT 1;", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!rows || !rows[0]) {
            logger.debug('getLastLogin: no login events found');
            currentConnection.release();
            return -1; // or handle accordingly
        } else {
            const output = rows[0]
            currentConnection.release();
               return output;
        }
    } else {
        logger.error('getLastLogin: connection is null, internal server error');
        currentConnection.release();
        return -1;
    }
} catch (error) {
    logger.error(`getLastLogin error: ${error.message}`);
    currentConnection.release();
    return -1;
} finally {
     if (currentConnection) {
        currentConnection.release(); // Ensure connection is released
    }
    
}

}

async function getSessionData(sessionId) {
    let currentConnection = null;
    try {
        currentConnection = await new Promise((resolve, reject) => {
            connection.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        return await new Promise((resolve, reject) => {
            const query = `SELECT data FROM sessions WHERE session_id = ?`;
            currentConnection.query(query, [sessionId], (err, rows) => {
                if (err) reject(err);
                else {
                    if (!rows || rows.length === 0) {
                        resolve(null);
                    } else {
                        try {
                            const sessionData = JSON.parse(rows[0].data);
                            resolve(sessionData? sessionData : null);
                        } catch (parseErr) {
                            reject(new Error(`Failed to parse session data: ${parseErr.message}`));
                        }
                    }
                }
            });
        });
    } catch (error) {
        logger.error(`getSessionTokens error: ${error.message}`);
        return null;
    } finally {
        if (currentConnection) {
            currentConnection.release();
        }
    }
}



const mySQLOps = {
    getCreateCommand,
    getEventAfterTimestamp,
    compareSessionID,
    getLastLogin,
    clearEventsBeforeTimestamp,
    getSessionData
};

module.exports = { mySQLOps };
