const nodeFetch = require("node-fetch");
const config = require("../config");
const logger = require("winston");

const client = config.ras;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
    "client_secret",
    "code",
    "refresh_token",
    "id_token",
    "access_token",
    "visa",
    "authorization",
    "passportJwt"
]);

function sanitizeRequestBody(body) {
    if (!body || typeof body !== "object") {
        return body;
    }

    return Object.fromEntries(Object.entries(body).map(([key, value]) => {
        if (SENSITIVE_KEYS.has(key)) {
            return [key, REDACTED];
        }
        return [key, value];
    }));
}

async function getRASTokenBundle(code, redirectURI) {
    const requestBody = {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectURI,
        client_id: client.CLIENT_ID,
        client_secret: client.CLIENT_SECRET,
        scope: client.SCOPE
    };
    logger.debug(`ras.auth.token_exchange.start url=${client.TOKEN_URL} body=${JSON.stringify(sanitizeRequestBody(requestBody))}`);
    try {
        const response = await nodeFetch(client.TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(requestBody)
        });
        logger.debug(`ras.auth.token_exchange.response status=${response.status}`);
        const jsonResponse = await response.json();
        if (response.status !== 200) {
            logger.error(`RAS token exchange failed with response ${JSON.stringify(jsonResponse)}`);
            const error = new Error("RAS token exchange failed");
            error.status = response.status;
            throw error;
        }
        logger.info("RAS token exchange succeeded");
        return jsonResponse;
    } catch (error) {
        logger.error(`RAS token exchange error: ${error.message}`);
        throw error;
    }
}

async function refreshRASTokenBundle(refreshToken) {
    const requestBody = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: client.CLIENT_ID,
        client_secret: client.CLIENT_SECRET,
        token_type_hint: "refresh_token"
    };
    logger.debug(`ras.auth.token_refresh.start url=${client.TOKEN_URL} body=${JSON.stringify(sanitizeRequestBody(requestBody))}`);
    try {
        const response = await nodeFetch(client.TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(requestBody)
        });
        const jsonResponse = await response.json();
        if (response.status !== 200) {
            logger.error(`RAS token refresh failed with status ${response.status}`);
            const error = new Error("RAS refresh failed");
            error.status = response.status;
            error.oauthError = jsonResponse?.error;
            throw error;
        }
        logger.info("RAS token refresh succeeded");
        return normalizeTokenResponse(jsonResponse);
    } catch (error) {
        logger.error(`RAS token refresh error: ${error.message}`);
        throw error;
    }
}

async function rasUserInfo(accessToken) {
    logger.debug(`ras.auth.userinfo.start url=${client.USERINFO_URL}`);
    try {
        const result = await nodeFetch(client.USERINFO_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (result.status !== 200) {
            logger.error(`RAS userinfo failed with status ${result.status}`);
            const error = new Error("RAS userinfo failed");
            error.status = result.status;
            throw error;
        }
        logger.info("RAS userinfo fetch succeeded");
        return result.json();
    } catch (error) {
        logger.error(`RAS userinfo error: ${error.message}`);
        throw error;
    }
}

async function validateRASPassport(passportJwt) {
    const requestBody = {
        visa: passportJwt
    };
    logger.debug(`ras.auth.passport_validate.start url=${client.VALIDATE_URL} body=${JSON.stringify(sanitizeRequestBody(requestBody))}`);
    try {
        const result = await nodeFetch(client.VALIDATE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(requestBody)
        });
        const payload = await result.text();
        const isValid = result.status === 200 && payload.trim() === "Valid";
        logger.info(`RAS passport validation completed: ${isValid ? "valid" : "invalid"}`);
        return isValid;
    } catch (error) {
        logger.error(`RAS passport validation error: ${error.message}`);
        throw error;
    }
}

async function rasLogout(idToken) {
    const requestBody = {
        client_id: client.CLIENT_ID,
        client_secret: client.CLIENT_SECRET,
        id_token: idToken
    };
    logger.debug(`ras.auth.logout.start url=${client.LOGOUT_URL} body=${JSON.stringify(sanitizeRequestBody(requestBody))}`);
    try {
        const response = await nodeFetch(client.LOGOUT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(requestBody)
        });
        if (response.status !== 200) {
            logger.error(`RAS logout failed with status ${response.status}`);
            const error = new Error("RAS logout failed");
            error.status = response.status;
            throw error;
        }
        logger.info("RAS logout succeeded");
        return response.ok;
    } catch (error) {
        logger.error(`RAS logout error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getRASTokenBundle,
    refreshRASTokenBundle,
    rasUserInfo,
    validateRASPassport,
    rasLogout
};