const session = require('express-session');
const {randomBytes} = require("crypto");
const mysql = require('mysql2/promise');
const config = require('../config');
const MySQLStore = require('express-mysql-session')(session);
let activeStore = null;
let activePool = null;

function createSession({ sessionSecret, session_timeout } = {}) {
    sessionSecret = sessionSecret || randomBytes(16).toString("hex");
        const poolOptions = {
            host: config.mysql_host,
            port: config.mysql_port,
            user: config.mysql_user,
            password: config.mysql_password,
            database: config.mysql_database
        };

        const storeOptions = {
            ...poolOptions,
            checkExpirationInterval: 10 * 1000, // 10 seconds
            expiration: session_timeout
        };

        const mysql2PromisePool = mysql.createPool(poolOptions);
        const mysqlStore = new MySQLStore(storeOptions, mysql2PromisePool);
        activePool = mysql2PromisePool;
        activeStore = mysqlStore;

    return session({
        secret: sessionSecret,
        // rolling: true,
        saveUninitialized: false,
        resave: true,
        store: mysqlStore
    });
}

async function closeSessionStore() {
    const store = activeStore;
    const pool = activePool;
    activeStore = null;
    activePool = null;

    if (store && typeof store.close === 'function') {
        await new Promise((resolve, reject) => {
            store.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    if (pool && typeof pool.end === 'function') {
        await pool.end();
    }
}

module.exports = {
    createSession,
    closeSessionStore
};