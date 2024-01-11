const {getDCFToken, dcfUserInfo, dcfLogout} = require("../services/dcf-auth");
const client = {
    login: async (code, redirectingURL) => {
         console.log("login")
          console.log(code)
        console.log(redirectingURL)
        const token = await getDCFToken(code, redirectingURL);
        const user = await dcfUserInfo(token);
        console.log(user)
       return {name: user.name ? user.name: '', lastName: user.name ? user.name: '', email: user.email, tokens: token, idp: 'dcf'};
    },

    authenticated: async (tokens) => {
        try {
            if (!tokens) {
                console.log('No tokens found!');
                return false
            }
            // If not passing, throw error
            await dcfUserInfo(tokens);
            return true;

        } catch (e) {
            console.log(e);
        }
        return false;
    },
    logout: async(tokens) => {
        return await dcfLogout(tokens);
    }
}

module.exports = client;