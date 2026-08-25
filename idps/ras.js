const {
    getRASTokenBundle,
    refreshRASTokenBundle,
    rasUserInfo,
    validateRASPassport,
    rasLogout
} = require("../services/ras-auth");
const logger = require("winston");

function isAuthFailure(error) {
    return error?.status === 401 || /401|invalid[_ ]token/i.test(error?.message || "");
}

const client = {
    login: async (code, redirectingURL) => {
        logger.debug("RAS login attempt");
        const rasTokens = await getRASTokenBundle(code, redirectingURL);
        logger.debug(`RAS tokens received: ${JSON.stringify(rasTokens)}`);
        const user = await rasUserInfo(rasTokens.access_token);
        logger.debug(`RAS userinfo received: ${JSON.stringify(user)}`);
        const isValid = await validateRASPassport(user?.passport_jwt_v11);
        logger.debug(`RAS passport validation result: ${isValid}`);

        if (!isValid) {
            throw new Error("RAS passport validation failed");
        }

        logger.info(`RAS login successful for user: ${user.email}`);
        return {
            name: user.first_name || "",
            lastName: user.last_name || "",
            email:user?.email || "",
            idp: "ras",
            tokens: rasTokens,
            userInfo: user
        };
    },

    authenticated: async (tokens) => {
        try {
            if (!tokens?.access_token) {
                logger.warn("RAS authentication check: no token bundle found");
                return false;
            }
            const user = await rasUserInfo(tokens.access_token);
            const isValid = await validateRASPassport(user?.passport_jwt_v11);
            return isValid;
        } catch (error) {
            
            logger.error(`RAS token validation failed: ${error.message}`);
        }
        return false;
    },

    logout: async(tokens) => {
        // RAS session logout requires the ID token from the stored token bundle.
        const idToken = typeof tokens === "string" ? tokens : tokens?.id_token;
        if (!idToken) {
            logger.warn("RAS logout skipped: no id_token found");
            return false;
        }

        return await rasLogout(idToken);
    }
};

module.exports = client;