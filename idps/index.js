const googleClient = require('./google');
const nihClient = require('./nih');
const dcfClient = require('./dcf');
const testIDP = require('./testIDP');
const {isCaseInsensitiveEqual} = require("../util/string-util");
const {NIH, GOOGLE, LOGIN_GOV, TEST, DCF} = require("../constants/idp-constants");

const oauth2Client = {
    login: async (code, idp, redirectingURL) => {
        switch (true) {
          case isCaseInsensitiveEqual(idp, GOOGLE):
            return googleClient.login(code, redirectingURL);

          case isCaseInsensitiveEqual(idp,NIH):
            return nihClient.login(code, redirectingURL);

          case isCaseInsensitiveEqual(idp, LOGIN_GOV):
            return nihClient.login(code, redirectingURL);

         case isCaseInsensitiveEqual(idp, DCF):
            return dcfClient.login(code, redirectingURL);
         
          default:
            return testIDP.login(code);
        }
    
    },
    authenticated: async (userSession, tokens, fileAcl) => {
        // Check Valid Token
        if (isCaseInsensitiveEqual(userSession.idp,GOOGLE)) {
            return await googleClient.authenticated(tokens);
        } else if (isCaseInsensitiveEqual(userSession.idp,NIH)) {
            return await nihClient.authenticated(tokens);
        }
        return false;
    },
    logout: async(idp, tokens) => {
        if (isCaseInsensitiveEqual(idp,NIH) || isCaseInsensitiveEqual(idp,LOGIN_GOV)) {
            return nihClient.logout(tokens);
        }
    }
}

module.exports = oauth2Client;