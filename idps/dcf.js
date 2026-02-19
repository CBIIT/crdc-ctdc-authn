const { getDCFToken, dcfUserInfo, dcfLogout } = require("../services/dcf-auth");
const client = {
  login: async (code, redirectingURL) => {
    console.log("DCF login initiated");
    console.log("DCF login - code:", code?.substring(0, 10) + "...");
    console.log("DCF login - redirectingURL:", redirectingURL);

    try {
      const token = await getDCFToken(code, redirectingURL);
      console.log("DCF token retrieved, fetching user info");

      const user = await dcfUserInfo(token);
      console.log("DCF user info retrieved for email:", user.email);

      const userData = {
        name: user.username || "",
        lastName: user.username || "",
        email: user.email,
        tokens: token,
        idp: "dcf",
      };

      console.log("DCF login successful for user:", userData.email);
      return userData;
    } catch (error) {
      console.error("DCF login failed:", {
        message: error.message,
        name: error.name,
        redirectingURL: redirectingURL,
      });
      throw error;
    }
  },

  authenticated: async (tokens) => {
    console.log("DCF authenticated check initiated");

    try {
      if (!tokens) {
        console.warn("DCF authenticated: No tokens found");
        return false;
      }

      console.log("DCF authenticated: Validating token with DCF");
      await dcfUserInfo(tokens);
      console.log("DCF authenticated: Token is valid");
      return true;
    } catch (e) {
      console.error("DCF authenticated failed:", {
        message: e.message,
        name: e.name,
      });
      return false;
    }
  },

  logout: async (tokens) => {
    console.log("DCF logout initiated");

    try {
      const result = await dcfLogout(tokens);
      console.log("DCF logout completed successfully");
      return result;
    } catch (error) {
      console.error("DCF logout failed:", {
        message: error.message,
        name: error.name,
      });
      throw error;
    }
  },
};

module.exports = client;
