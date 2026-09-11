const mysql = require('mysql2');
const config = require('../config.js');
const logger = require('../logger');

const connection = mysql.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    insecureAuth : false,
    connectTimeout: 60000, // 60 seconds
    waitForConnections: true
});

const getTTL = (req, res) => {
    logger.debug('Getting session TTL');

    const sessionID = getSessionIDFromCookie(req);
    if (!sessionID) {
        return res.json({ttl: 0});
    }

    connection.query("select expires from sessions where session_id=?", [sessionID], (err, rows) => {
        let response;
        if (err){
            logger.error(`TTL query failed: ${err.message}`);
            response = {ttl: null, error: "An error occurred while querying the database, see logs for details"};
        }
        else if (!rows || !rows[0] || !rows[0].expires){
            response = {ttl: 0};
        }
        else{
            let expires = rows[0].expires;
            let dt = new Date(expires * 1000);
            let ttl = Math.round((dt.valueOf() - Date.now())/1000);
            response = {ttl: ttl};
        }
        res.json(response);
    });
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

exports.getTTL = getTTL;
