const mysql = require('mysql');
const config = require('../config.js');

const connection = mysql.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    insecureAuth : false
});

const getTTL = async (req, res) => {
    console.log("getTTL");
    let response = {};

    try {
        connection.getConnection(async function (err, currentConnection) {
            if (err) {
                console.log(err);
                response = { ttl: null, error: "Could not establish a connection to the session database, see logs for details" };
            } else {
                const sessionID = getSessionIDFromCookie(req, res);
                if (sessionID === null) {
                    response = { ttl: 0 };
                } else {
                    try {
                        connection.query("select expires from sessions where session_id=?", sessionID, (err, rows) => {
                            if (err) {
                                console.log(err);
                                response = { ttl: null, error: "An error occurred while querying the database, see logs for details" };
                            } else if (!rows || !rows[0] || !rows[0].expires) {
                                response = { ttl: 0 };
                            } else {
                                let expires = rows[0].expires;
                                let dt = new Date(expires * 1000);
                                let ttl = Math.round((dt.valueOf() - Date.now()) / 1000);
                                response = { ttl: ttl };
                            }
                        });
                    } catch (queryError) {
                        console.log(queryError);
                        response = { ttl: null, error: "An error occurred while processing the query, see logs for details" };
                    }
                }
            }
            currentConnection.release();
            res.json(response);
        });
    } catch (connectionError) {
        console.log(connectionError);
        response = { ttl: null, error: "An unexpected connectionError occurred, see logs for details" };
        res.json(response);
    }
}

function getSessionIDFromCookie(req, res) {
    if (!req || !req?.cookies || !req?.cookies["connect.sid"]) {
        console.log("this Req " + req?.cookies);
        return null;
    } else {
        return req?.cookies["connect.sid"].match(':.*[.]')[0].slice(1, -1);
    }
}

exports.getTTL = getTTL;