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
            console.log( "An error occurred while querying the database, see logs for details");
            return;
        }
        else if (sessionID !== null){
            connection.query("select expires from sessions where session_id=?", sessionID, (err, rows) => {
                let response;
                if (err){
                    console.log(err);
                    console.log( "An error occurred while querying the database, see logs for details");

                    return;
                }
                else if (!rows || !rows[0] || !rows[0].expires){
                    response = {ttl: 0};

                    return;
                }
                else{
                    let expires = rows[0].expires;
                    let dt = new Date(expires * 1000);
                    let ttl = Math.round((dt.valueOf() - Date.now())/1000);
                    response = {ttl: ttl};

                    return;
                }

            });
        }
        else {
            console.log("An internal server error occurred, please contact the administrators");
        }
        currentConnection.release();
    });
}

function getSessionIDFromCookie(req, res){
    try{
    if (!req || !req?.cookies || !req?.cookies["connect.sid"]){
        res.json({ttl: 0});
        return null;
    }
    else{
        return req?.cookies["connect.sid"].match(':.*[.]')[0].slice(1,-1);
    }
}
    catch{
        console.log("error getting session ID from cookie " + req)
    }
}

exports.getTTL = getTTL;