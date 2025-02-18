const mysql = require('mysql');
const config = require('../config.js');

const connection = mysql.createPool({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database,
    insecureAuth : false
});

const getTTL = (req, res) => {
    console.log("getTTL")

     connection.getConnection(async function (err, currentConnection) {
        const sessionID = getSessionIDFromCookie(req, res);
        if (err) {
            console.log(err);
            res.json({ttl: null, error: "Could not establish a connection to the session database, see logs for details"});
            return;
        }
        else if (sessionID !== null){
            connection.query("select expires from sessions where session_id=?", sessionID, (err, rows) => {
                let response;
                if (err){
                    console.log(err);
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
        else {
            res.json({ttl: null, error: "An internal server error occurred, please contact the administrators"});
        }
        currentConnection.release();
    });
}

function getSessionIDFromCookie(req, res){
    console.log("Check these cookies : " + req.cookies)
    if (!req || !req?.cookies || !req?.cookies["connect.sid"]){
        console.log("this Req " + req?.cookies)
        res.json({ttl: 0});
        return null;
    }
    else{
        console.log("Check these cookies also on the else  : " + req.cookies)
        return req?.cookies["connect.sid"].match(':.*[.]')[0].slice(1,-1);
    }
}

exports.getTTL = getTTL;